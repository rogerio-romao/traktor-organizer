import { createTestingPinia } from '@pinia/testing';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';

import FilterBar from '@/components/layout/FilterBar.vue';
import { useTracksStore } from '@/stores/tracks';

import type { ComputedRef, Ref } from 'vue';
import type { Playlist } from '@/stores/playlists';
import type { TrackRow } from '@/types/track';

vi.mock('@/composables/usePlaylistView', () => ({
    usePlaylistView: (): {
        activePlaylist: Ref<Playlist | null>;
        hasPendingUpdate: Ref<boolean>;
        hasRemovals: ComputedRef<boolean>;
        hasTrackEdits: ComputedRef<boolean>;
        playlistTracks: Ref<TrackRow[]>;
        updatePlaylist: ReturnType<typeof vi.fn>;
    } => ({
        activePlaylist: ref<Playlist | null>(null),
        hasPendingUpdate: ref(false),
        hasRemovals: computed(() => false),
        hasTrackEdits: computed(() => false),
        playlistTracks: ref<TrackRow[]>([]),
        updatePlaylist: vi.fn(),
    }),
}));
vi.mock('@/composables/usePlaylistSave', () => ({
    usePlaylistSave: (): { open: () => void } => ({ open: vi.fn() }),
}));
vi.mock('@/composables/useAudioPlayer', () => ({
    useAudioPlayer: (): { setQueue: () => void } => ({ setQueue: vi.fn() }),
}));

function makeTrack(id: number, overrides: Partial<TrackRow> = {}): TrackRow {
    return {
        album: '',
        artist: 'Artist',
        audioId: '',
        bitrate: null,
        bpm: 130,
        bpmQuality: null,
        catalogNo: '',
        color: null,
        commentRaw: '',
        coverArtId: '',
        duration: 300,
        durationFloat: 300,
        fileName: `track${id}.mp3`,
        filePath: `/music/track${id}.mp3`,
        filesize: null,
        flags: null,
        genre: 'Techno',
        id,
        importDate: '',
        keyLyrics: '',
        label: '',
        lastPlayed: '',
        loudnessAnalyzed: null,
        loudnessPeak: null,
        loudnessPerceived: null,
        mix: '',
        musicalKey: '4d',
        musicalKeyValue: 10,
        nmlDir: '/music/',
        nmlFile: `track${id}.mp3`,
        nmlVolume: 'osx',
        nmlVolumeId: 'osx',
        playCount: 0,
        producer: '',
        rating: 3,
        releaseDate: '',
        remixer: '',
        tags: [],
        title: `Track ${id}`,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

function renderBar(extraTracks: TrackRow[] = []): ReturnType<typeof useTracksStore> {
    const tracks = [
        makeTrack(1, { genre: 'Techno', musicalKey: '4d' }),
        makeTrack(2, { genre: 'House', musicalKey: '5m' }),
        ...extraTracks,
    ];
    render(FilterBar, {
        global: {
            plugins: [
                createTestingPinia({
                    initialState: {
                        tracks: {
                            activeTagFilters: [],
                            allTracks: tracks,
                            genreFilter: null,
                            globalSearch: '',
                            keyFilter: null,
                            ratingFilter: null,
                        },
                    },
                    stubActions: true,
                }),
            ],
        },
    });
    return useTracksStore();
}

describe('FilterBar', () => {
    it('genre select updates genreFilter on the store', async () => {
        const store = renderBar();
        await userEvent.selectOptions(screen.getByLabelText('Genre'), 'Techno');
        expect(store.genreFilter).toBe('Techno');
    });

    it('key select updates keyFilter on the store', async () => {
        const store = renderBar();
        await userEvent.selectOptions(screen.getByLabelText('Key'), '4d');
        expect(store.keyFilter).toBe('4d');
    });

    it('rating select updates ratingFilter on the store', async () => {
        const store = renderBar();
        await userEvent.selectOptions(screen.getByLabelText('Rating'), '3');
        expect(store.ratingFilter).toBe(3);
    });

    it('"Clear all" button is hidden when no filters are active', () => {
        renderBar();
        expect(screen.queryByRole('button', { name: /Clear all/i })).toBeNull();
    });

    it('"Clear all" button calls clearFilters when a filter is active', async () => {
        const store = renderBar();
        store.genreFilter = 'Techno';
        await nextTick();
        await userEvent.click(screen.getByRole('button', { name: /Clear all/i }));
        expect(store.clearFilters).toHaveBeenCalled();
    });
});
