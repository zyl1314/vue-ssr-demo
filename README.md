# vue-ssr  

可以使用git查看提交的历史记录，总共有三个迭代，循序渐进

## 前言
这个项目写给那些想要了解服务端渲染但又不知道从何入手的同学，主要内容提取于[Vue 2.0 SSR](https://ssr.vuejs.org/zh/)文档。  

## 开始
```
$ npm install 
$ npm run build-server
$ npm run build-client
$ npm run server
```
浏览器打开localhost:8080

## 依赖版本
```
vue@2.2.2 + vue-router@2.2.0 + vuex@2.2.1 + vue-server-renderer@2.2.2
```

注意：请一定注意版本的匹配问题，很多解决不了的问题可能是由于版本不匹配造成的。


## 什么是服务端渲染，为什么需要服务端渲染  

先不回答问题，我们先来看一下常规的vue项目在浏览器是如何加载的：
![image](https://github.com/zyl1314/vue-ssr/blob/master/img/1.png)
上图是一个vue的spa项目，服务器返回来的东西很简单（标红线部分），仅仅一个根容器和一个js标签，但是我们在浏览器上看到的并不是空页面啊，这我们都知道是通过加载的js文件动态渲染出来的。
但是这样做有两个最大的问题：
- 1.无法SEO
因为你只有根标签，爬虫是什么也爬不到的
- 2.首屏白屏问题
我们知道我们看到的浏览器内容是通过js渲染出来的，但是假如js文件的体积很大，需要下载很长时间，那这一段时间浏览器是什么也没有的，看起来就会很难受。  

我们再来说什么是服务端渲染（针对vue），假如我们有一个spa博客系统，有三个页面home、blog、about，常规的vue做法将整个项目工程打包成一个js文件供浏览器加载，不管你在地址栏输入
```
localhost:8080/home
```

```
localhost:8080/blog
```

```
localhost:8080/about
```
response都是这样的：
```
<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <meta charset="utf-8">
  <title></title>
</head>

<body>
  <div id="app"></div>
  <script type="text/javascript" src="/build.js"></script>
</body>
</html>
```
然后js再根据你的路由渲染相应的内容出来  

服务端渲染就是将这部分工作提前，我在服务端就读取到你的路由，提前将对应内容渲染出来返回给浏览器，这时你输入
```
localhost:8080/about
```
返回的内容可能就是下面这样了
```
<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <meta charset="utf-8">
  <title></title>
</head>

<body>
  <div id="app">
	<div>this is about page</div>
  </div>
  <script type="text/javascript" src="/build.js"></script>
</body>
</html>
```
## 正文  

我们一步一步迭代，最终完成一个使用包含vue-router和vuex的demo

### 版本一，单纯的展示一个页面。

```
/* server.js */
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
```
然后启动服务器
```
node server
```
在地址栏输入
```
localhost:8080
```
就可以看到hello world。  

事实上以上vue-server-renderer就是ssr的核心，它可以将vue实例拼接为dom字符串，背后的原理（虚拟dom算法）我们无需知道。


### 版本二，多个页面，加入vue-router 

我们在做之前先捋一捋：  
1.每个页面我们都会做成.vue组件，所以需要webpack打包。  
2.在版本一中我们已经知道，核心就是renderer将vue实例渲染为dom字符串返回。添加了路由也是一样的，但此时渲染的dom字符串仅仅是对应用户输入的路由，那用户切换路由时其他的页面怎么展示呢，这就需要我们事先按照常规的方式将项目打包一遍（客户端打包文件），然后利用script标签插入到返回的html文档中
```
res.send(`
    <!DOCTYPE html>
    <html lang="en">
        <head><title>Hello</title></head>
        <body>${html}</body>
        <script src="/bundle.client.js"></script>
    </html>			
`)
```
在客户端文件加载完成后，我们点击链接就可以正常跳转了。当然服务端返回的初始路由页面是我们所希望的，客户端js并不会再重新渲染一遍了。  
3.根据我们上一点所说，我们是应该打包成两个文件的，一个是供服务端渲染（服务端代码），一个是供客户端渲染（客户端代码）。  
4.服务端代码和客户端代码大部分是相同的，都是新建一个vue实例，添加路由信息。但是有不同，首先客户端代码是需要提供挂载元素的，服务端不需要。另一个不同是服务端代码需要需要预先根据输入的路由解析出来需要渲染的组件。  
5.根据上一点我们可以将公用的代码抽取出来，然后提供两个入口，分别供服务端和客户端打包。  


目录结构如下：
```
/* 目录结构 */
| - routes
| - views
  - App.vue
  - app.js
  - entry-client.js
  - entry-server.js
```

我们先编写通用的代码，即除了entry-client.js和server-client.js之外的代码，编写这些与我们平时的vue代码并无不同，唯一需要注意的一点是我们创建vue实例（以及下面的路由和vuex）时，最好利用工厂函数导出，这样每一个请求对应的都是一个新的vue实例。

```
/* app.js */

import Vue from 'vue'
import App from './App.vue' 
import { createRouter } from './routes/index.js'

// 导出一个工厂函数，用于创建新的
// 应用程序、router实例


export function createApp () {
  const router = createRouter()

  const app = new Vue({
    router,
    render: h => h(App)
  })
  return { app, router }
}
```
总共有三个页面
```
/*  App.vue */
<template>
    <div>
        <nav>
            <router-link to="/home">home</router-link>
            <router-link to="/blog">blog</router-link>
            <router-link to="/about">about</router-link>
        </nav>
        <router-view></router-view>
    </div>
</template>

<script>

export default {
    data() {
        return {
        }
    }
}
</script>
```
定义路由
```
/*  routes */
import Vue from 'vue'
import Router from 'vue-router'
import homeRouter from './home.js'
import aboutRouter from './about.js'
import blogRouter from './blog.js'

Vue.use(Router)

export function createRouter() {   
    return new Router({
        mode: 'history',
        routes: [
            ...homeRouter,
            ...aboutRouter,
            ...blogRouter
        ]
    })
}

```
页面很简单，如下：
```
/* blog页面 */
<template>
  <div>welcome to zyl's blog</div>
</template>

<script>
export default {
  data() {
      return {}
  }
}
</script>
```
另外两个页面和上面的一样  

我们关注的点在两个入口文件
```
/* entry-client.js */

import { createApp } from './app'
// 客户端特定引导逻辑……
const { app } = createApp()

// 这里假定 App.vue 模板中根元素具有 `id="app"`
app.$mount('#app')
```
entry-server.js很简单，起到了挂载vue实例的作用。  

我们先想一下server.js要做什么，毫无疑问它应该将当前路由push到路由对象，从而使renderer渲染处正确的视图
```
import { createApp } from './app'

// context是一个包含路由信息的对象
export default context => {

    const { app, router } = createApp()
    router.push(context.url)

    const matchedComponents = router.getMatchedComponents()
    if (!matchedComponents.length) return({code: 404})

	return app
}
```
有一个地方需要注意：我们是把所有的视图组件打包到了一个js文件中，所有上面查找匹配路由的时候采用了同步的写法。实际上我们通常会用到code split，对应的写法如下：
```
const { app, router } = createApp()
router.push(context.url)

router.onReady(() => {
    const matchedComponents = router.getMatchedComponents()
    if (!matchedComponents.length) {
        return reject({code: 404})
    }

    resolve(app)          
})
```
webpack配置如下，主要就是打包到dist目录下
```
/* webpack.server.js */
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  target: 'node', 
  entry: path.join(projectRoot, 'src/entry-server.js'),
  output: {
	// commonjs规范输出
    libraryTarget: 'commonjs2', 
    path: path.join(projectRoot, 'dist'),
    filename: 'bundle.server.js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: projectRoot,
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.runtime.esm.js' 
    }
  }
}
```
webpack.client.js配置与上面大致相同  

最后我们再看一下server
```
const fs = require('fs')
const path = require('path')
const express = require('express')
const renderer = require('vue-server-renderer').createRenderer()
const app = express()

// Client-Side Bundle File
const clientBundleFileUrl = '/bundle.client.js'
app.use('/', express.static(__dirname + '/dist'))

// Server-Side Bundle File
const createApp = require('./dist/bundle.server.js')['default']

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
                <script src="${clientBundleFileUrl}"></script>
            </body>
            </html>`)
        }
    })

})

// Start server
app.listen(8080)
```
注意最后要将客户端文件引入  
![image](https://github.com/zyl1314/vue-ssr/blob/master/img/2.png)
可以看到，这时候已经返回的内容已经在服务端渲染过了


### 版本三 数据的预取  

现在我们的需求变了，blog页面不能那么简单了，需要把blog列表的标题提前渲染出来，而博文信息是需要动态获取的，这涉及到数据的预取。怎么解决呢，文章中这么说
```
在服务器端渲染(SSR)期间，我们本质上是在渲染我们应用程序的"快照"，所以如果应用程序依赖于一些异步数据，那么在开始渲染过程之前，需要先预取和解析好这些数据。

另一个需要关注的问题是在客户端，在挂载(mount)到客户端应用程序之前，需要获取到与服务器端应用程序完全相同的数据 - 否则，客户端应用程序会因为使用与服务器端应用程序不同的状态，然后导致混合失败。

为了解决这个问题，获取的数据需要位于视图组件之外，即放置在专门的数据预取存储容器(data store)或"状态容器(state container)）"中。首先，在服务器端，我们可以在渲染之前预取数据，并将数据填充到 store 中。此外，我们将在 HTML 中序列化(serialize)和内联预置(inline)状态。这样，在挂载(mount)到客户端应用程序之前，可以直接从 store 获取到内联预置(inline)状态。

为此，我们将使用官方状态管理库 Vuex。
```

我们写把vuex简单写一下
```
/* store.js */
import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export function createStore () {
  return new Vuex.Store({
    state: {
      blogList: []
    },
    actions: {
      getList ({ commit }) {
		// 注意这里一定要返回一个promise，下面会看到原因
        return axios.get('http://localhost:8000/api/getList').then((res) => {
            commit('setList', res.data.list)
        })
      }
    },
    mutations: {
      setList (state, list) {
        state.blogList = list
      }
    }
  })
}
```
vuex的状态改变只能通过mutations操作，并且只能是同步的，异步的行文要放在action中。上面是一个简单的获取博客列表的逻辑。

那么组件是在哪里dispatch呢，可以在路由组件上暴露一个自定义静态函数asyncData，需要将 store 和路由信息作为参数传递进去：
```
<template>
  <ul>
    <li v-for="blog in blogList" :key="blog.title">
      <h2>{{blog.title}}</h2>
    </li>
  </ul>
</template>

<script>
export default {
  asyncData( { store, router }) {
    return store.dispatch('getList')
  },

  computed: {
    blogList() {
      return this.$store.state.blogList
    }
  }
}
</script>
```
我们的下一步工作就是在服务端渲染时检查匹配到的路由组件，看他是否有asyncData方法，如果有就将store和router传入调用

```
import { createApp } from './app'

export default context => {
	
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()
    router.push(context.url)

    const matchedComponents = router.getMatchedComponents()
    if (!matchedComponents.length) {
		return reject({code: 404})
	}
		
    Promise.all(matchedComponents.map(Component => {
		// 这个地方就是上面dispatch一定要返回一个promise的原因
        if (Component.asyncData) {
			return Component.asyncData({
              store,
			  router
            })
        }
    })).then(() => {
        context.state = store.state
        resolve(app)          
    }).catch(reject)
  })
  
}
```
我们看到执行完dispatch的逻辑之后，有这么一行代码
```
context.state = store.state
```
这是干什么呢，我们再回头看看最初文档里面提到的几句话
```
我们将在 HTML 中序列化(serialize)和内联预置(inline)状态。这样，在挂载(mount)到客户端应用程序之前，可以直接从 store 获取到内联预置(inline)状态。
```
其实就是将store的状态同步到客户端
```
// 在返回的内容中插入一个标签，把store的状态挂载到window对象上，客户端自然可以取到
<script>window.__INITIAL_STATE__ = ${JSON.stringify(context.state)}</script>
```
```
import { createApp } from './app'

const { app, store } = createApp()

// 同步store
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

app.$mount('#app')
```
最后一项工作是解决客户端如何获取数据，我们可以在mount之前检查组件是否有asyncData方法，有的话执行就可以了
```
  beforeMount () {
    const { asyncData } = this.$options
    if (asyncData) {
      // 将获取数据操作分配给 promise
      // 以便在组件中，我们可以在数据准备就绪后
      // 通过运行 `this.dataPromise.then(...)` 来执行其他任务
      this.dataPromise = asyncData({
        store: this.$store
      })
    }
  }
```
可以通过mixin为全局的组件添加
```
Vue.mixin({
  beforeMount () {
    const { asyncData } = this.$options
    if (asyncData) {
      // 将获取数据操作分配给 promise
      // 以便在组件中，我们可以在数据准备就绪后
      // 通过运行 `this.dataPromise.then(...)` 来执行其他任务
      this.dataPromise = asyncData({
        store: this.$store
      })
    }
  }
})
```
![image](https://github.com/zyl1314/vue-ssr/blob/master/img/3.png)
可以看到，数据已经被取到并且渲染出来了。  

至此，全文完。

## 参考
http://csbun.github.io/blog/2016/08/vue-2-0-server-side-rendering/






