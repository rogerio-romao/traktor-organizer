import { ref } from 'vue';

const visible = ref(false);
const trackId = ref<number>(0);

export function useTagEditor(): {
    open: (id: number) => void;
    close: () => void;
    trackId: typeof trackId;
    visible: typeof visible;
} {
    function open(id: number): void {
        trackId.value = id;
        visible.value = true;
    }
    function close(): void {
        visible.value = false;
    }
    return { close, open, trackId, visible };
}
