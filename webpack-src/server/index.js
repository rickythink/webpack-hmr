const Express = require('express')
const http = require('http')
const mime = require('mime')
const path = require('path')
const socket = require('socket.io')
const MemoryFileSystem = require('memory-fs')
const update = require('./update')

class Server {
  constructor(compiler) {
    this.compiler = compiler
    update(compiler) // 更改config的entry属性，增加client/index.js和dev-server.js
    this.currentHash = undefined // 编译hash
    this.clientSocketList = [] // 客户端集合
    this.fs = undefined // 文件系统
    this.server = undefined // http实例
    this.app = undefined // express实例
    this.middleware = undefined // webpack-dev-middleware返回的中间件

    this.setupHooks() // 监听done事件
    this.setupApp() // 创建express实例
    this.setupDevMiddleware() // webpack-dev-middleware
    this.routes() // app使用中间件
    this.createServer() // 创建静态服务器
    this.createSocketServer() // 创建websocket服务器
  }

  setupHooks() {
    const { compiler } = this
    compiler.hooks.done.tap('webpack-dev-server', stats => {
      console.log('stats.hash', stats.hash)

      this.currentHash = stats.hash
      // 每当新一个编译完成后都会向客户端发送消息
      this.clientSocketList.forEach(socket => {
        // 发送最新的hash
        socket.emit('hash', this.currentHash)
        // 再向客户端发送一个ok
        socket.emit('ok')
      })
    })
  }

  // 实现webpack-dev-middleware功能
  setupDevMiddleware() {
    const { compiler } = this

    // 以watch模式进行编译，会监控文件的变化
    compiler.watch({}, () => {
      console.log('Compiled successfully!')
    })

    // 设置文件系统为内存文件系统
    const fs = new MemoryFileSystem()
    this.fs = compiler.outputFileSystem = fs

    // express中间件，将编译的文件返回
    const staticMiddleWare = fileDir => {
      return (req, res, next) => {
        let { url } = req
        if (url === '/favicon.ico') {
          return res.sendStatus(404)
        }
        if (url === '/') url = '/index.html'
        const filePath = path.join(fileDir, url)
        try {
          const statObj = this.fs.statSync(filePath)
          if (statObj.isFile()) {
            const content = this.fs.readFileSync(filePath)
            // 路径和原来写到磁盘的一样，只是这是写到内存中了
            res.setHeader('Content-Type', mime.getType(filePath))
            res.send(content)
          } else {
            res.sendStatus(404)
          }
        } catch (error) {
          res.sendStatus(404)
        }
      }
    }
    this.middleware = staticMiddleWare // 将中间件挂载在this实例上，以便app使用
  }

  setupApp() {
    this.app = new Express()
  }

  routes() {
    const { compiler } = this
    const config = compiler.options
    this.app.use(this.middleware(config.output.path))
  }

  createServer() {
    this.server = http.createServer(this.app)
  }

  createSocketServer() {
    // 实现一个websocket长链接
    const io = socket(this.server)
    io.on('connection', socket => {
      console.log('a new client connect server')

      this.clientSocketList.push(socket)
      socket.on('disconnect', () => {
        const num = this.clientSocketList.indexOf(socket)
        this.clientSocketList = this.clientSocketList.splice(num, 1)
      })
      // 向客户端发送最新的一个编译hash
      socket.emit('hash', this.currentHash)
      // 再向客户端发送一个ok
      socket.emit('ok')
    })
  }

  listen(port, host = 'localhost', cb) {
    this.server.listen(port, host, cb)
  }
}

module.exports = Server
