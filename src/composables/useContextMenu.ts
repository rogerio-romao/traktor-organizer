import { ref } from 'vue'

export interface ContextMenuItem {
  label: string
  action: () => void
  divider?: boolean  // show a divider line before this item
}

// Module-level state — one context menu shared across the whole app
const visible = ref(false)
const position = ref({ x: 0, y: 0 })
const items = ref<ContextMenuItem[]>([])

export function useContextMenu() {
  function show(x: number, y: number, menuItems: ContextMenuItem[]) {
    // Estimate menu dimensions to avoid going off-screen
    const menuWidth = 190
    const menuHeight = menuItems.length * 32 + 16
    position.value = {
      x: Math.max(4, Math.min(x, window.innerWidth - menuWidth - 4)),
      y: Math.max(4, Math.min(y, window.innerHeight - menuHeight - 4)),
    }
    items.value = menuItems
    visible.value = true
  }

  function hide() {
    visible.value = false
  }

  return { visible, position, items, show, hide }
}
