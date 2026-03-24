import { ref } from 'vue'
import type { TrackFilters } from '../utils/filterTracks'

// Module-level state — one playlist save dialog shared across the whole app
const visible = ref(false)
const defaultName = ref('')
const trackIds = ref<number[]>([])
const filterState = ref<TrackFilters | null>(null)

export function usePlaylistSave() {
  function open(name: string, ids: number[], filters?: TrackFilters) {
    defaultName.value = name
    trackIds.value = [...ids]
    filterState.value = filters ?? null
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  return { visible, defaultName, trackIds, filterState, open, close }
}
