<script setup lang="ts">
import { usePlaylistView } from '../../composables/usePlaylistView'
import type { Playlist } from '../../stores/playlists'

defineProps<{ playlist: Playlist; trackCount: number }>()

const { closePlaylist } = usePlaylistView()
</script>

<template>
  <div class="playlist-header">
    <button class="btn-back" @click="closePlaylist">← Collection</button>
    <div class="header-info">
      <span class="playlist-name">{{ playlist.name }}</span>
      <span class="playlist-meta">{{ trackCount }} track{{ trackCount === 1 ? '' : 's' }}</span>
    </div>
    <div class="header-actions">
      <!-- Export button — Phase 3 item 2 -->
    </div>
  </div>
</template>

<style scoped>
.playlist-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  height: 40px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-back {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-back:hover { color: var(--accent); }

.header-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex: 1;
  overflow: hidden;
}

.playlist-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-meta {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
