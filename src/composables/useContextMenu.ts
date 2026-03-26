import { ref } from 'vue';

// Module-level state — one context menu shared across the whole app
const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const items = ref<ContextMenuItem[]>([]);

export interface ContextMenuItem {
    label: string;
    action: () => void;
    divider?: boolean; // show a divider line before this item
}

export function useContextMenu(): {
    show: (x: number, y: number, menuItems: ContextMenuItem[]) => void;
    hide: () => void;
    items: typeof items;
    position: typeof position;
    visible: typeof visible;
} {
    function show(x: number, y: number, menuItems: ContextMenuItem[]): void {
        // Estimate menu dimensions to avoid going off-screen
        const menuWidth = 190;
        const menuHeight = menuItems.length * 32 + 16;
        position.value = {
            x: Math.max(4, Math.min(x, window.innerWidth - menuWidth - 4)),
            y: Math.max(4, Math.min(y, window.innerHeight - menuHeight - 4)),
        };
        items.value = menuItems;
        visible.value = true;
    }

    function hide(): void {
        visible.value = false;
    }

    return { hide, items, position, show, visible };
}
