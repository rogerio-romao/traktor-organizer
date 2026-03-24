import { ref } from 'vue'
import type { Playlist } from '../stores/playlists'

// Module-level singleton — controls which playlist is open in the main view
const activePlaylist = ref<Playlist | null>(null)

export function usePlaylistView() {
  function openPlaylist(playlist: Playlist) {
    activePlaylist.value = playlist
  }

  function closePlaylist() {
    activePlaylist.value = null
  }

  return { activePlaylist, openPlaylist, closePlaylist }
}
