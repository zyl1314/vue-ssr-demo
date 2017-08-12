const fs = require('fs')
const path = require('path')
const express = require('express')
const renderer = require('vue-server-renderer').createRenderer()
const app = express()

// Server-Side Bundle File
const createApp = require('./dist/bundle.server.js')['default']

// Client-Side Bundle File
const clientBundleFilePath = path.join(__dirname, './dist/bundle.client.js')
const clientBundleFileUrl = '/bundle.client.js'

// Client-Side Bundle File
app.get(clientBundleFileUrl, (req, res) => {
  const clientBundleFileCode = fs.readFileSync(clientBundleFilePath, 'utf8')
  res.send(clientBundleFileCode)
})

// Server-Side Rendering
app.get('*', (req, res) => {

  const context = { url: req.url }

  const app = createApp(context)
  
  if (app.code && app.code == 404) {
	  res.status(404).end('Page not found')
	  return 
  }

    renderer.renderToString(app, (err, html) => {
        if (err){
        res.status(500).send(`
            <h1>Error: ${err.message}</h1>
            <pre>${err.stack}</pre>
        `)
        } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Vue 2.0 SSR</title>
            </head>
            <body>
                <div id="app">
                ${html}
                </div>
                <script>window.__INITIAL_STATE__ = ${JSON.stringify(context.state)}</script>
                <script src="${clientBundleFileUrl}"></script>
            </body>
            </html>`)
        }
    })

})

// Start server
const PORT = 8000
app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`)
})