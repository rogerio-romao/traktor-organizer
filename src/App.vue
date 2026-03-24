<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import ContextMenu from './components/common/ContextMenu.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import PlaylistSaveDialog from './components/common/PlaylistSaveDialog.vue'
import TagEditor from './components/tracks/TagEditor.vue'
import { runStartupMaintenance } from './services/database'

onMounted(async () => {
  await runStartupMaintenance()
  document.addEventListener('contextmenu', e => e.preventDefault())
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-content">
      <RouterView />
    </div>
  </div>
  <ContextMenu />
  <ConfirmDialog />
  <PlaylistSaveDialog />
  <TagEditor />
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
