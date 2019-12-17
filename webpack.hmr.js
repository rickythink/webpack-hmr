const webpack = require('webpack')
const Server = require('./webpack-src/server')
const config = require('./webpack.config')

// 创建webpack实例
const compiler = webpack(config)
// 创建Server实例
const server = new Server(compiler)

server.listen(8000, 'localhost', () => {
  console.log(`Project is running at http://localhost:8000/`)
})
