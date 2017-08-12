const fs = require('fs')
const path = require('path')
const express = require('express')
const renderer = require('vue-server-renderer').createRenderer()
const app = express()

// Server-Side Bundle File
const createApp = require('./dist/bundle.server.js')['default']

// Client-Side Bundle File
const clientBundleFileUrl = '/bundle.client.js'
app.use('/', express.static(__dirname + '/dist'))

// api
app.get('/api/getList', (req, res) => {
    res.json(
        {
            list: [
                {'title': 11},
                {'title': 22},
                {'title': 33},
                {'title': 44}
            ]
        }
    )
})

// Server-Side Rendering
app.get('*', (req, res) => {

  const context = { url: req.url }
  
  createApp(context).then(app => {
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
    });
  }, err => {
    if (err.code === 404) {
        res.status(404).end('Page not found')
    } else {
        res.status(500).end('Internal Error')
    }
  })

})

// Start server
app.listen(8080)