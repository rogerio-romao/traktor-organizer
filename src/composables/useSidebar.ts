import { ref } from 'vue'

const isOpen = ref(localStorage.getItem('traktor-sidebar-open') !== 'false')

export function useSidebar() {
  function toggle() {
    isOpen.value = !isOpen.value
    localStorage.setItem('traktor-sidebar-open', String(isOpen.value))
  }
  return { isOpen, toggle }
}
