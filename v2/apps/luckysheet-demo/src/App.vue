<template>
  <div class="luckysheet-mvtp">
    <LuckysheetWrapper />
  </div>
</template>

<script setup lang="ts">
import LuckysheetWrapper from '@/components/LuckysheetWrapper.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.luckysheet-mvtp {
  width: 100%;
  height: 100%;
}
</style>