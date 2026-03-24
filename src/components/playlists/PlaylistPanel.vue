<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlaylistsStore, type Playlist } from '../../stores/playlists'
import { usePlaylistView } from '../../composables/usePlaylistView'
import { useTracksStore } from '../../stores/tracks'
import { useConfirm } from '../../composables/useConfirm'

const playlistsStore = usePlaylistsStore()
const { activePlaylist, openPlaylist } = usePlaylistView()
const tracksStore = useTracksStore()
const { confirm } = useConfirm()

function handleOpenPlaylist(playlist: Playlist) {
  tracksStore.clearFilters()
  openPlaylist(playlist)
}

onMounted(() => playlistsStore.loadPlaylists())

async function deletePlaylist(playlist: Playlist) {
  const ok = await confirm(`Delete "${playlist.name}"?`)
  if (!ok) return
  if (activePlaylist.value?.id === playlist.id) activePlaylist.value = null
  await playlistsStore.deletePlaylist(playlist.id)
}
</script>

<template>
  <div class="playlist-panel">
    <div v-if="playlistsStore.playlists.length === 0" class="empty-state">
      No playlists saved yet.
    </div>
    <ul v-else class="playlist-list">
      <li
        v-for="playlist in playlistsStore.playlists"
        :key="playlist.id"
        class="playlist-item"
        :class="{ active: activePlaylist?.id === playlist.id }"
        @click="handleOpenPlaylist(playlist)"
      >
        <span class="playlist-name">{{ playlist.name }}</span>
        <span class="playlist-count">{{ playlist.trackCount }}</span>
        <button class="btn-delete" title="Delete playlist" @click.stop="deletePlaylist(playlist)">✕</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.playlist-panel {
  height: 100%;
  overflow-y: auto;
}

.empty-state {
  padding: 24px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.playlist-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.playlist-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  cursor: pointer;
  gap: 8px;
}
.playlist-item:hover { background: var(--bg-hover); }
.playlist-item.active { background: rgba(255, 102, 0, 0.1); }

.playlist-name {
  font-size: 12px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.playlist-count {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.btn-delete {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  padding: 0;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s;
}
.playlist-item:hover .btn-delete { opacity: 0.6; }
.playlist-item:hover .btn-delete:hover { opacity: 1; color: #c0392b; }
</style>
