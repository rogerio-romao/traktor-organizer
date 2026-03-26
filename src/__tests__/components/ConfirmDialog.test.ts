import { nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';

import { useConfirm } from '@/composables/useConfirm';

import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

beforeEach(() => {
    const { visible, respond } = useConfirm();
    if (visible.value) respond(false);
});

describe('ConfirmDialog', () => {
    it('is not visible initially', () => {
        render(ConfirmDialog);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('confirm button resolves the promise with true', async () => {
        render(ConfirmDialog);
        const { confirm } = useConfirm();
        const promise = confirm('Delete this track?', 'Delete');
        await nextTick();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        await expect(promise).resolves.toBe(true);
    });

    it('cancel button resolves the promise with false', async () => {
        render(ConfirmDialog);
        const { confirm } = useConfirm();
        const promise = confirm('Delete this track?', 'Delete');
        await nextTick();
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await expect(promise).resolves.toBe(false);
    });

    it('dialog is announced as dialog role with accessible name from message', async () => {
        render(ConfirmDialog);
        const { confirm } = useConfirm();
        confirm('Are you sure?');
        await nextTick();
        expect(
            screen.getByRole('dialog', { name: 'Are you sure?' }),
        ).toBeTruthy();
    });

    it('dialog disappears after responding', async () => {
        render(ConfirmDialog);
        const { confirm } = useConfirm();
        confirm('Remove?');
        await nextTick();
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await nextTick();
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});
