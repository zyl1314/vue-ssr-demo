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
