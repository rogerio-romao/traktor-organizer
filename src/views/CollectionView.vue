<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useTracksStore } from '../stores/tracks'
import { useTagsStore } from '../stores/tags'
import { usePlaylistView } from '../composables/usePlaylistView'
import { usePlaylistsStore } from '../stores/playlists'
import type { TrackRow } from '../types/track'
import AppSidebar from '../components/layout/AppSidebar.vue'
import FilterBar from '../components/layout/FilterBar.vue'
import TrackTable from '../components/tracks/TrackTable.vue'
import PlaylistHeader from '../components/playlists/PlaylistHeader.vue'

const tracksStore = useTracksStore()
const tagsStore = useTagsStore()
const playlistsStore = usePlaylistsStore()
const { activePlaylist } = usePlaylistView()

const playlistTracks = ref<TrackRow[]>([])
const playlistLoading = ref(false)

watch(activePlaylist, async (playlist) => {
  if (!playlist) { playlistTracks.value = []; return }
  playlistLoading.value = true
  playlistTracks.value = await playlistsStore.loadPlaylistTracks(playlist.id)
  playlistLoading.value = false
})

onMounted(async () => {
  await tracksStore.loadAllTracks()
  await tagsStore.loadAllTags()
})
</script>

<template>
  <div class="collection-view">
    <AppSidebar />

    <div class="collection-main">
      <template v-if="activePlaylist">
        <PlaylistHeader :playlist="activePlaylist" :track-count="playlistTracks.length" />
        <TrackTable :tracks="playlistTracks" :loading="playlistLoading" storage-namespace="traktor-playlist" />
      </template>
      <template v-else>
        <FilterBar />
        <TrackTable />
      </template>
    </div>
  </div>
</template>

<style scoped>
.collection-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

.collection-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
