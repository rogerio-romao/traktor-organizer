import { ref, computed } from 'vue'
import { getDb } from '../services/database'
import { usePlaylistsStore, type Playlist } from '../stores/playlists'
import type { TrackRow } from '../types/track'

// Module-level singleton — controls which playlist is open in the main view
const activePlaylist  = ref<Playlist | null>(null)
const playlistTracks  = ref<TrackRow[]>([])
const playlistLoading = ref(false)
const removedTrackIds = ref(new Set<number>())

export function usePlaylistView() {
  const hasRemovals = computed(() => removedTrackIds.value.size > 0)

  async function openPlaylist(playlist: Playlist) {
    activePlaylist.value = playlist
    removedTrackIds.value = new Set()
    playlistLoading.value = true
    playlistTracks.value = await usePlaylistsStore().loadPlaylistTracks(playlist.id)
    playlistLoading.value = false
  }

  function closePlaylist() {
    activePlaylist.value = null
    playlistTracks.value = []
    removedTrackIds.value = new Set()
  }

  function removeTrack(trackId: number) {
    removedTrackIds.value = new Set([...removedTrackIds.value, trackId])
    playlistTracks.value = playlistTracks.value.filter(t => t.id !== trackId)
  }

  async function updatePlaylist(trackIds: number[]) {
    if (!activePlaylist.value) return
    const db = await getDb()
    const pid = activePlaylist.value.id
    await db.execute('DELETE FROM playlist_tracks WHERE playlist_id = $1', [pid])
    for (let i = 0; i < trackIds.length; i++) {
      await db.execute(
        'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3)',
        [pid, trackIds[i], i],
      )
    }
    activePlaylist.value = { ...activePlaylist.value, trackCount: trackIds.length }
    removedTrackIds.value = new Set()
    const store = usePlaylistsStore()
    playlistTracks.value = await store.loadPlaylistTracks(pid)
    await store.loadPlaylists()
  }

  return {
    activePlaylist,
    playlistTracks,
    playlistLoading,
    hasRemovals,
    openPlaylist,
    closePlaylist,
    removeTrack,
    updatePlaylist,
  }
}
