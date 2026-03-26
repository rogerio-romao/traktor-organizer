import { createTestingPinia } from '@pinia/testing';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import RatingCell from '@/components/tracks/RatingCell.vue';
import { useTracksStore } from '@/stores/tracks';

function renderCell(value: number, trackId = 42): ReturnType<typeof useTracksStore> {
    render(RatingCell, {
        global: { plugins: [createTestingPinia()] },
        props: { trackId, value },
    });
    return useTracksStore();
}

describe('RatingCell', () => {
    it('renders 5 star radio elements', () => {
        renderCell(0);
        expect(screen.getAllByRole('radio')).toHaveLength(5);
    });

    it('stars up to value are aria-checked', () => {
        renderCell(3);
        const radios = screen.getAllByRole('radio');
        expect(radios[0].getAttribute('aria-checked')).toBe('true');
        expect(radios[2].getAttribute('aria-checked')).toBe('true');
        expect(radios[3].getAttribute('aria-checked')).toBe('false');
    });

    it('clicking star 3 calls updateRating(42, 3)', async () => {
        const store = renderCell(0);
        await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
        expect(store.updateRating).toHaveBeenCalledWith(42, 3);
    });

    it('clicking star 1 when value is already 1 toggles to 0', async () => {
        const store = renderCell(1);
        await userEvent.click(screen.getByRole('radio', { name: '1 star' }));
        expect(store.updateRating).toHaveBeenCalledWith(42, 0);
    });

    it('clicking the same star (not star 1) when value matches is a no-op', async () => {
        const store = renderCell(3);
        await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
        expect(store.updateRating).not.toHaveBeenCalled();
    });

    it('pressing Enter on a focused star updates the rating', async () => {
        const store = renderCell(0);
        const star3 = screen.getByRole('radio', { name: '3 stars' });
        star3.focus();
        await userEvent.keyboard('{Enter}');
        expect(store.updateRating).toHaveBeenCalledWith(42, 3);
    });

    it('pressing Space on a focused star updates the rating', async () => {
        const store = renderCell(0);
        const star3 = screen.getByRole('radio', { name: '3 stars' });
        star3.focus();
        await userEvent.keyboard(' ');
        expect(store.updateRating).toHaveBeenCalledWith(42, 3);
    });
});
