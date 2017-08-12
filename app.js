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