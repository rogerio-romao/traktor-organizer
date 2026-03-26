import { ref } from 'vue';
import type { TrackFilters } from '@/utils/filterTracks';

// Module-level state — one playlist save dialog shared across the whole app
const visible = ref(false);
const defaultName = ref('');
const trackIds = ref<number[]>([]);
const filterState = ref<TrackFilters | null>(null);

export function usePlaylistSave(): {
    open: (name: string, ids: number[], filters?: TrackFilters) => void;
    close: () => void;
    defaultName: typeof defaultName;
    trackIds: typeof trackIds;
    filterState: typeof filterState;
    visible: typeof visible;
} {
    function open(name: string, ids: number[], filters?: TrackFilters): void {
        defaultName.value = name;
        trackIds.value = [...ids];
        filterState.value = filters ?? null;
        visible.value = true;
    }

    function close(): void {
        visible.value = false;
    }

    return { close, defaultName, filterState, open, trackIds, visible };
}
