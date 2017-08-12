import Vue from 'vue'
import App from './App.vue' 
import { createRouter } from './routes/index.js'
import { createStore } from './store'
import { sync } from 'vuex-router-sync'


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


// 导出一个工厂函数，用于创建新的
// 应用程序、router 和 store 实例

export function createApp () {
  const router = createRouter()
  const store = createStore()

  // 同步路由状态(route state)到 store
  sync(store, router)

  const app = new Vue({
    router,
    store,
    // 根实例简单的渲染应用程序组件。
    render: h => h(App)
  })
  return { app, router, store }
}