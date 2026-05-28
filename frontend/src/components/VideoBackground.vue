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
.video-bg-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(59, 130, 246, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 60% at 85% 100%, rgba(99, 102, 241, 0.18) 0%, transparent 55%),
    linear-gradient(180deg, rgba(5, 7, 20, 0.55), rgba(5, 7, 20, 0.7));
}
</style>
