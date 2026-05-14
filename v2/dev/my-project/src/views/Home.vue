<template>
  <div class="home">
    <h1>{{ title }}</h1>
    <p>Welcome to my-project</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('my-project')
</script>

<style scoped>
.home {
  @apply p-8;
}
</style>
