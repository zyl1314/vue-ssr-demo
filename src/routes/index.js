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