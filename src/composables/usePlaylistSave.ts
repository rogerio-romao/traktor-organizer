import { ref } from 'vue'

// Module-level state — one playlist save dialog shared across the whole app
const visible = ref(false)
const defaultName = ref('')
const trackIds = ref<number[]>([])

export function usePlaylistSave() {
  function open(name: string, ids: number[]) {
    defaultName.value = name
    trackIds.value = [...ids]
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  return { visible, defaultName, trackIds, open, close }
}
