import { ref, computed } from 'vue'
import { getDb } from '../services/database'
import { usePlaylistsStore, type Playlist } from '../stores/playlists'
import { useTracksStore } from '../stores/tracks'
import { filterTracks } from '../utils/filterTracks'
import type { TrackRow } from '../types/track'

// Module-level singleton — controls which playlist is open in the main view
const activePlaylist    = ref<Playlist | null>(null)
const playlistTracks    = ref<TrackRow[]>([])
const playlistLoading   = ref(false)
const removedTrackIds   = ref(new Set<number>())
const hasPendingUpdate  = ref(false)

// Non-null when re-running the saved filters produces a different track set than what's saved
const suggestedTracks   = ref<TrackRow[] | null>(null)

export function usePlaylistView() {
  const hasRemovals = computed(() => removedTrackIds.value.size > 0)

  async function openPlaylist(playlist: Playlist) {
    activePlaylist.value = playlist
    removedTrackIds.value = new Set()
    hasPendingUpdate.value = false
    suggestedTracks.value = null

    playlistLoading.value = true
    const store = usePlaylistsStore()
    playlistTracks.value = await store.loadPlaylistTracks(playlist.id)
    playlistLoading.value = false

    // Drift detection: re-run the saved filters against the current collection and
    // compare the resulting track ID set against what's actually saved in the playlist.
    if (playlist.filterState) {
      const allTracks = useTracksStore().allTracks
      if (allTracks.length > 0) {
        const fresh = filterTracks(allTracks, playlist.filterState)
        const savedIds  = new Set(playlistTracks.value.map(t => t.id))
        const freshIds  = new Set(fresh.map(t => t.id))
        const isDifferent =
          savedIds.size !== freshIds.size ||
          [...freshIds].some(id => !savedIds.has(id))
        if (isDifferent) suggestedTracks.value = fresh
      }
    }
  }

  function closePlaylist() {
    activePlaylist.value = null
    playlistTracks.value = []
    removedTrackIds.value = new Set()
    hasPendingUpdate.value = false
    suggestedTracks.value = null
  }

  function removeTrack(trackId: number) {
    removedTrackIds.value = new Set([...removedTrackIds.value, trackId])
    playlistTracks.value = playlistTracks.value.filter(t => t.id !== trackId)
  }

  function applySuggestedUpdate() {
    if (!suggestedTracks.value) return
    playlistTracks.value = suggestedTracks.value
    suggestedTracks.value = null
    hasPendingUpdate.value = true
    removedTrackIds.value = new Set()
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
    hasPendingUpdate.value = false
    suggestedTracks.value = null
    const store = usePlaylistsStore()
    // Patch the sidebar count immediately before the async reload
    const idx = store.playlists.findIndex(p => p.id === pid)
    if (idx !== -1) store.playlists[idx] = { ...store.playlists[idx], trackCount: trackIds.length }
    playlistTracks.value = await store.loadPlaylistTracks(pid)
    await store.loadPlaylists()
  }

  return {
    activePlaylist,
    playlistTracks,
    playlistLoading,
    hasRemovals,
    hasPendingUpdate,
    suggestedTracks,
    openPlaylist,
    closePlaylist,
    removeTrack,
    applySuggestedUpdate,
    updatePlaylist,
  }
}
