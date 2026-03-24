<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import { runStartupMaintenance } from './services/database'

onMounted(async () => {
  await runStartupMaintenance()
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.app-content {
  flex: 1;
  overflow: hidden;
  display: flex;
}
</style>
