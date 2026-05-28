<template>
  <div v-if="show" class="video-bg" aria-hidden="true">
    <video
      :key="current.src"
      :src="current.src"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
    ></video>
    <div class="video-bg-overlay"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBackground } from '../composables/useBackground'

const { current, isWeb } = useBackground()

const show = computed(() => isWeb() && !!current.value?.src)
</script>

<style scoped>
.video-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.video-bg video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Overlay bem sutil — só pra dar leitura ao conteúdo sem escurecer o vídeo */
.video-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 7, 20, 0.18), rgba(5, 7, 20, 0.28));
}
</style>
