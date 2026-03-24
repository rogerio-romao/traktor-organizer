import { ref } from 'vue'

const isOpen = ref(true)

export function useSidebar() {
  function toggle() { isOpen.value = !isOpen.value }
  return { isOpen, toggle }
}
