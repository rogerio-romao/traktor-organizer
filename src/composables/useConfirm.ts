import { ref } from 'vue';

const visible = ref(false);
const message = ref('');
const confirmLabel = ref('Confirm');
let resolveCallback: ((confirmed: boolean) => void) | null = null;

export function useConfirm(): {
    confirm: (msg: string, label?: string) => Promise<boolean>;
    confirmLabel: typeof confirmLabel;
    message: typeof message;
    respond: (confirmed: boolean) => void;
    visible: typeof visible;
} {
    function confirm(msg: string, label = 'Confirm'): Promise<boolean> {
        message.value = msg;
        confirmLabel.value = label;
        visible.value = true;
        return new Promise((resolve) => {
            resolveCallback = resolve;
        });
    }

    function respond(confirmed: boolean): void {
        visible.value = false;
        resolveCallback?.(confirmed);
        resolveCallback = null;
    }

    return { confirm, confirmLabel, message, respond, visible };
}
