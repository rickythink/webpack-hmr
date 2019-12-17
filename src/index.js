const divEl = document.createElement('div')
document.body.appendChild(divEl)

const render = () => {
  const content = require('./content').default
  divEl.innerText = content
}
render()

if (module.hot) {
  module.hot.accept(['./content.js'], render)
}
