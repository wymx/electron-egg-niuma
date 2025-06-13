<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
    <div v-if="isDev"
      style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px;">
      当前路由: {{ $route.path }}
    </div>
  </router-view>
</template>
<script setup>
import { onMounted, ref } from 'vue';
const isDev = ref(process.env.NODE_ENV === 'development');
onMounted(() => {
  const loadingElement = document.getElementById('loadingPage');
  if (loadingElement) {
    loadingElement.remove();
  }
});
</script>
<style lang="less"></style>