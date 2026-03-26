import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

import EditableTextCell from '@/components/tracks/EditableTextCell.vue';

function renderCell(value: string): { onSave: ReturnType<typeof vi.fn> } {
    const onSave = vi.fn().mockResolvedValue(null);
    render(EditableTextCell, { props: { onSave, value } });
    return { onSave };
}

describe('EditableTextCell', () => {
    it('displays value as text in non-editing mode', () => {
        renderCell('Original');
        expect(screen.getByText('Original')).toBeTruthy();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('shows em-dash placeholder when value is empty', () => {
        renderCell('');
        expect(screen.getByText('—')).toBeTruthy();
    });

    it('single click enters edit mode and shows input with current value', async () => {
        renderCell('Original');
        await userEvent.click(screen.getByText('Original'));
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('Original');
    });

    it('typing and pressing Enter commits the new value', async () => {
        const { onSave } = renderCell('Original');
        await userEvent.click(screen.getByText('Original'));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'New Value');
        await userEvent.keyboard('{Enter}');
        expect(onSave).toHaveBeenCalledWith('New Value');
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('pressing Escape reverts without saving', async () => {
        const { onSave } = renderCell('Original');
        await userEvent.click(screen.getByText('Original'));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'Discarded');
        await userEvent.keyboard('{Escape}');
        expect(onSave).not.toHaveBeenCalled();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('blur commits the value', async () => {
        const { onSave } = renderCell('Original');
        await userEvent.click(screen.getByText('Original'));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'Blurred');
        await userEvent.tab();
        expect(onSave).toHaveBeenCalledWith('Blurred');
    });

    it('trims whitespace on commit', async () => {
        const { onSave } = renderCell('Original');
        await userEvent.click(screen.getByText('Original'));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, '  Padded  ');
        await userEvent.keyboard('{Enter}');
        expect(onSave).toHaveBeenCalledWith('Padded');
    });

    it('does not call onSave when value is unchanged', async () => {
        const { onSave } = renderCell('Original');
        await userEvent.click(screen.getByText('Original'));
        await userEvent.keyboard('{Enter}');
        expect(onSave).not.toHaveBeenCalled();
    });
});
