const Vue = require('vue')
const renderer = require('vue-server-renderer').createRenderer()
const server = require('express')()

// vue实例
const app = new Vue({
	template: '<div>hello world</div>'
})

// 服务端渲染
server.get('/', (req, res) => {
	renderer.renderToString(app, (err, html) => {
		if (err) {
			res.status(500).end('Internal Server Error')
			// 注意return
			return 
		}
		res.send(`
			<!DOCTYPE html>
			<html lang="en">
				<head><title>Hello</title></head>
				<body>${html}</body>
			</html>			
		`)
	})
})

server.listen(8080)