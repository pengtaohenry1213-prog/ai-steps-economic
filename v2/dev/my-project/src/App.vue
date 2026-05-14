<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('App mounted')
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
