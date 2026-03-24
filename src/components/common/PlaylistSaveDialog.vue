<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePlaylistSave } from '../../composables/usePlaylistSave'
import { savePlaylist } from '../../services/database'

const { visible, defaultName, trackIds, close } = usePlaylistSave()

const name = ref('')
const saving = ref(false)

watch(visible, (val) => {
  if (val) name.value = defaultName.value
})

async function onSave() {
  if (!name.value.trim() || saving.value) return
  saving.value = true
  try {
    await savePlaylist(name.value.trim(), trackIds.value)
    close()
  } finally {
    saving.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onSave()
  if (e.key === 'Escape') close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @mousedown.self="close">
      <div class="dialog" @keydown="onKeydown">
        <h3 class="dialog-title">Save Playlist</h3>
        <p class="dialog-subtitle">{{ trackIds.length }} track{{ trackIds.length === 1 ? '' : 's' }}</p>
        <input
          v-model="name"
          class="dialog-input"
          type="text"
          placeholder="Playlist name"
          autofocus
        />
        <div class="dialog-actions">
          <button class="btn-cancel" @click="close">Cancel</button>
          <button
            class="btn-save"
            :disabled="!name.trim() || saving"
            @click="onSave"
          >{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  width: 340px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
}

.dialog-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-subtitle {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dialog-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 16px;
}
.dialog-input:focus { border-color: var(--accent); }

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel {
  height: 30px;
  padding: 0 14px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}
.btn-cancel:hover { color: var(--text-primary); border-color: var(--text-secondary); }

.btn-save {
  height: 30px;
  padding: 0 14px;
  background: var(--accent);
  border: none;
  border-radius: 5px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:hover:not(:disabled) { background: var(--accent-dim); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
