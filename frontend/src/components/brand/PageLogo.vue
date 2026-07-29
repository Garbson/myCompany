<template>
  <span class="page-logo" :class="`page-logo--${size}`" aria-hidden="true">
    <i class="page-logo__fold"></i>
    <i class="page-logo__line line-one"></i>
    <i class="page-logo__line line-two"></i>
    <i class="page-logo__line line-three"></i>
  </span>
</template>

<script setup>
defineProps({ size: { type: String, default: 'md' } })
</script>

<style scoped>
.page-logo{--logo-size:36px;position:relative;display:inline-block;width:calc(var(--logo-size)*.76);height:var(--logo-size);flex:none;overflow:hidden;background:#fffdf7;border:1.5px solid #2e2a22;border-radius:2px 7px 3px 5px;box-shadow:3px 3px 0 rgba(184,89,61,.26);transform:rotate(-2deg)}
.page-logo--sm{--logo-size:27px}.page-logo--lg{--logo-size:56px}
.page-logo__fold{position:absolute;top:-1.5px;right:-1.5px;width:31%;aspect-ratio:1;background:#ead9b9;border-left:1.5px solid #2e2a22;border-bottom:1.5px solid #2e2a22;clip-path:polygon(0 0,100% 100%,0 100%)}
.page-logo__line{position:absolute;left:20%;height:1.5px;background:#b8593d;border-radius:50%;transform:rotate(-1deg)}
.line-one{top:45%;width:48%}.line-two{top:61%;width:58%;background:#6b7a3f}.line-three{top:77%;width:40%;background:#2c4a5c}
</style>
