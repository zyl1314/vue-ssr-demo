// store.js
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
        return axios.get('http://localhost:8080/api/getList').then((res) => {
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