<template>
  <div id="wrap">
    <canvas id="canvas" width="480" height="560" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick, onUnmounted } from 'vue'
import { loadGame, pause } from './game/xenophobia'

onMounted(async () => {
  console.log('Starting the game')
  await nextTick()
  loadGame()
})

onUnmounted(() => {
  console.log('Ending the game')
  pause()
})
</script>

<style lang="postcss">
html,
body {
  background-color: #222226;
  height: 100%;
}
#app {
  height: 100%;
}
#wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
#canvas {
  background-color: #636171;
  border: 1px solid;
  background-image: url('./assets/background.png');
}
</style>
