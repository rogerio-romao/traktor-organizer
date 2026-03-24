<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useContextMenu, type ContextMenuItem } from '../../composables/useContextMenu'

const { visible, position, items, hide } = useContextMenu()

const devItems: ContextMenuItem[] = import.meta.env.DEV ? [
  {
    label: 'Reload',
    action: () => location.reload(),
    divider: true,
  },
  {
    label: 'Inspect Element',
    action: () => invoke('open_devtools'),
  },
] : []

const allItems = () => [...items.value, ...devItems]

function runAction(action: () => void) {
  hide()
  action()
}

function onMousedown() {
  hide()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') hide()
}

watch(visible, (val) => {
  if (val) {
    document.addEventListener('mousedown', onMousedown)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('mousedown', onMousedown)
    document.removeEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onMousedown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @mousedown.stop
    >
      <template v-for="(item, i) in allItems()" :key="i">
        <div v-if="item.divider" class="context-divider" />
        <button class="context-item" @click="runAction(item.action)">
          {{ item.label }}
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 190px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.context-item {
  display: block;
  width: 100%;
  padding: 7px 14px;
  text-align: left;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.context-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.context-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
</style>
