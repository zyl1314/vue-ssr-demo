<template>
  <ul>
    <li v-for="blog in blogList" :key="blog.title">
      <h2>{{blog.title}}</h2>
    </li>
  </ul>
</template>

<script>
export default {
  asyncData( { store }) {
    return store.dispatch('getList')
  },

  computed: {
    blogList() {
      return this.$store.state.blogList
    }
  }
}
</script>