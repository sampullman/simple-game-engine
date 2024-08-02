<template>
  <div id="wrap">
    <canvas id="breakout-canvas" width="400" height="300" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick, onUnmounted } from 'vue'
import { loadGame, pause } from './game/game'

onMounted(async () => {
  console.log('Starting the game')
  await nextTick()
  loadGame('breakout-canvas')
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

#breakout-canvas {
  width: 100%;
  background-color: #777;
  border: 1px solid;
  width: 400px;
  height: 300px;
}
</style>
