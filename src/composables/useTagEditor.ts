import { ref } from 'vue'

const visible = ref(false)
const trackId = ref<number>(0)

export function useTagEditor() {
  function open(id: number) {
    trackId.value = id
    visible.value = true
  }
  function close() {
    visible.value = false
  }
  return { visible, trackId, open, close }
}
