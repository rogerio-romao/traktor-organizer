<script setup lang="ts">
import { ref } from 'vue'
import { useTracksStore } from '../../stores/tracks'
import { useTagsStore } from '../../stores/tags'
import { useContextMenu } from '../../composables/useContextMenu'
import { useSidebar } from '../../composables/useSidebar'
import ImportDialog from '../common/ImportDialog.vue'
import type { ImportStats } from '../../composables/useImport'

const tracksStore = useTracksStore()
const tagsStore = useTagsStore()
const importDialog = ref<InstanceType<typeof ImportDialog> | null>(null)
const { show: showContextMenu } = useContextMenu()
const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar()

async function onImported(_stats: ImportStats) {
  await tracksStore.loadAllTracks()
  await tagsStore.loadAllTags()
}


function onHeaderContextMenu(e: MouseEvent) {
  if (!import.meta.env.DEV) return
  e.preventDefault()
  showContextMenu(e.clientX, e.clientY, [
    { label: 'Reload', action: () => location.reload() },
    { label: 'Inspect Element', action: () => import('@tauri-apps/api/core').then(({ invoke }) => invoke('open_devtools')) },
  ])
}
</script>

<template>
  <header class="app-header">
    <div class="header-left" @contextmenu="onHeaderContextMenu">
      <button
        class="btn-sidebar-toggle"
        :class="{ active: sidebarOpen }"
        title="Toggle sidebar"
        @click="toggleSidebar"
      >&#9776;</button>
      <span class="app-name">Traktor Organizer</span>
    </div>

    <div class="header-center">
      <div class="search-wrapper">
        <span class="search-icon">⌕</span>
        <input
          v-model="tracksStore.globalSearch"
          class="search-input"
          type="text"
          placeholder="Search tracks…"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
        />
        <button
          v-if="tracksStore.globalSearch"
          class="search-clear"
          title="Clear search"
          @click="tracksStore.globalSearch = ''"
        >✕</button>
      </div>
    </div>

    <div class="header-right">
      <button class="btn-import" @click="importDialog?.open()">
        Import playlist
      </button>
    </div>
  </header>

  <ImportDialog ref="importDialog" @imported="onImported" />
</template>

<style scoped>
.app-header {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-left {
  flex-shrink: 0;
  min-width: 160px;
}

.btn-sidebar-toggle {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  padding: 2px 6px 2px 0;
  line-height: 1;
  cursor: pointer;
}
.btn-sidebar-toggle:hover,
.btn-sidebar-toggle.active { color: var(--text-primary); }

.app-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.header-center {
  flex: 1;
  max-width: 480px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 9px;
  color: var(--text-secondary);
  font-size: 20px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 30px;
  padding: 0 28px 0 30px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}
.search-input::placeholder { color: var(--text-secondary); }
.search-input:focus { border-color: var(--accent); }


.search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 15px;
  padding: 2px;
  line-height: 1;
}
.search-clear:hover { color: var(--text-primary); }

.header-right {
  flex-shrink: 0;
  margin-left: auto;
}

.btn-import {
  height: 30px;
  padding: 0 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
}
.btn-import:hover { background: var(--accent-dim); }
</style>
