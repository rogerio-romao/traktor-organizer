// oxlint-disable max-lines

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { createDbState } from './helpers/db-stub';
import { savePlaylist } from '@/services/database';
import { usePlaylistsStore } from '@/stores/playlists';
import { usePlaylistView } from '@/composables/usePlaylistView';
import { useTracksStore } from '@/stores/tracks';

import type { DbState } from './helpers/db-stub';
import type { TrackDbRow, TrackRow } from '@/types/track';

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState;

vi.mock('@/services/database', async () => {
    const { makeDbMock } = await import('./helpers/db-stub');
    return makeDbMock(() => s);
});

function makeDbTrack(
    id: number,
    overrides: Partial<TrackDbRow> = {},
): TrackDbRow {
    return {
        album: '',
        artist: `Artist ${id}`,
        audio_id: '',
        bitrate: null,
        bpm: 130,
        bpm_quality: null,
        catalog_no: '',
        color: null,
        comment_raw: '',
        cover_art_id: '',
        duration: 300,
        duration_float: 300,
        file_name: `track${id}.mp3`,
        file_path: `/music/track${id}.mp3`,
        filesize: null,
        flags: null,
        genre: 'Techno',
        id,
        import_date: '',
        key_lyrics: '',
        label: '',
        last_played: '',
        loudness_analyzed: null,
        loudness_peak: null,
        loudness_perceived: null,
        mix: '',
        musical_key: '4d',
        musical_key_value: 10,
        nml_dir: '/music/',
        nml_file: `track${id}.mp3`,
        nml_volume: 'osx',
        nml_volume_id: 'osx',
        play_count: 0,
        producer: '',
        rating: 4,
        release_date: '',
        remixer: '',
        title: `Track ${id}`,
        ...overrides,
    };
}

function makeStoreTrack(
    id: number,
    overrides: Partial<TrackRow> = {},
): TrackRow {
    return {
        album: '',
        artist: `Artist ${id}`,
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
        rating: 4,
        releaseDate: '',
        remixer: '',
        tags: [],
        title: `Track ${id}`,
        ...overrides,
    };
}

beforeEach(() => {
    s = createDbState();
    setActivePinia(createPinia());
    // Reset the module-level singleton state
    usePlaylistView().closePlaylist();
});

// ── savePlaylist ──────────────────────────────────────────────────────────────

describe('savePlaylist', () => {
    it('creates a playlist row and links tracks', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2));

        await savePlaylist('My Playlist', [1, 2]);

        expect(s.playlists).toHaveLength(1);
        expect(s.playlists[0].name).toBe('My Playlist');
        expect(s.playlist_tracks.map((pt) => pt.track_id)).toEqual([1, 2]);
    });

    it('stores filter_state JSON when provided', async () => {
        const filterState = JSON.stringify({
            activeTagFilters: ['techno'],
            globalSearch: 'test',
        });

        await savePlaylist('Filtered', [], filterState);

        expect(s.playlists[0].filter_state).toBe(filterState);
    });
});

// ── openPlaylist ──────────────────────────────────────────────────────────────

describe('openPlaylist — loading tracks', () => {
    it('loads the playlist tracks and exposes them via playlistTracks', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2));
        s.playlists.push({
            created_at: new Date().toISOString(),
            description: '',
            filter_state: null,
            id: 10,
            name: 'Evening Set',
        });
        s.playlist_tracks.push(
            { playlist_id: 10, position: 0, track_id: 1 },
            { playlist_id: 10, position: 1, track_id: 2 },
        );

        const view = usePlaylistView();
        await view.openPlaylist({
            createdAt: new Date().toISOString(),
            description: '',
            filterState: null,
            id: 10,
            name: 'Evening Set',
            trackCount: 2,
        });

        expect(view.playlistTracks.value).toHaveLength(2);
        expect(view.playlistTracks.value.map((t) => t.id)).toEqual([1, 2]);
    });

    it('respects saved track order (position column)', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3));
        s.playlists.push({
            created_at: new Date().toISOString(),
            description: '',
            filter_state: null,
            id: 10,
            name: 'Set',
        });
        s.playlist_tracks.push(
            { playlist_id: 10, position: 0, track_id: 3 },
            { playlist_id: 10, position: 1, track_id: 1 },
            { playlist_id: 10, position: 2, track_id: 2 },
        );

        const view = usePlaylistView();
        await view.openPlaylist({
            createdAt: new Date().toISOString(),
            description: '',
            filterState: null,
            id: 10,
            name: 'Set',
            trackCount: 3,
        });

        expect(view.playlistTracks.value.map((t) => t.id)).toEqual([3, 1, 2]);
    });
});

// ── Drift detection ───────────────────────────────────────────────────────────

describe('drift detection', () => {
    it('sets suggestedTracks when filter re-run yields different tracks', async () => {
        // Saved playlist has tracks 1 and 2
        s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3));
        s.playlists.push({
            created_at: new Date().toISOString(),
            description: '',
            filter_state: JSON.stringify({
                activeTagFilters: [],
                genreFilter: 'Techno',
                globalSearch: '',
                keyFilter: null,
                ratingFilter: null,
            }),
            id: 10,
            name: 'Dynamic Set',
        });
        s.playlist_tracks.push(
            { playlist_id: 10, position: 0, track_id: 1 },
            { playlist_id: 10, position: 1, track_id: 2 },
        );

        // Populate the live tracks store (includes track 3 which was not in the saved playlist)
        const tracksStore = useTracksStore();
        tracksStore.allTracks = [
            makeStoreTrack(1, { genre: 'Techno' }),
            makeStoreTrack(2, { genre: 'Techno' }),
            makeStoreTrack(3, { genre: 'Techno' }), // new track that matches the filter
        ];

        const view = usePlaylistView();
        const playlist = {
            createdAt: new Date().toISOString(),
            description: '',
            filterState: {
                activeTagFilters: [],
                genreFilter: 'Techno',
                globalSearch: '',
                keyFilter: null,
                ratingFilter: null,
            },
            id: 10,
            name: 'Dynamic Set',
            trackCount: 2,
        };
        await view.openPlaylist(playlist);

        // Filter re-run returns 3 tracks but saved has 2 → drift
        expect(view.suggestedTracks.value).not.toBeNull();
        expect(view.suggestedTracks.value).toHaveLength(3);
    });

    it('does NOT set suggestedTracks when filter re-run matches saved tracks', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2));
        s.playlists.push({
            created_at: new Date().toISOString(),
            description: '',
            filter_state: JSON.stringify({
                activeTagFilters: [],
                genreFilter: 'Techno',
                globalSearch: '',
                keyFilter: null,
                ratingFilter: null,
            }),
            id: 11,
            name: 'Stable Set',
        });
        s.playlist_tracks.push(
            { playlist_id: 11, position: 0, track_id: 1 },
            { playlist_id: 11, position: 1, track_id: 2 },
        );

        const tracksStore = useTracksStore();
        tracksStore.allTracks = [
            makeStoreTrack(1, { genre: 'Techno' }),
            makeStoreTrack(2, { genre: 'Techno' }),
        ];

        const view = usePlaylistView();
        await view.openPlaylist({
            createdAt: new Date().toISOString(),
            description: '',
            filterState: {
                activeTagFilters: [],
                genreFilter: 'Techno',
                globalSearch: '',
                keyFilter: null,
                ratingFilter: null,
            },
            id: 11,
            name: 'Stable Set',
            trackCount: 2,
        });

        expect(view.suggestedTracks.value).toBeNull();
    });
});

// ── applySuggestedUpdate ──────────────────────────────────────────────────────

describe('applySuggestedUpdate', () => {
    // oxlint-disable-next-line max-statements
    it('replaces playlistTracks with the suggested tracks', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3));
        s.playlists.push({
            created_at: new Date().toISOString(),
            description: '',
            filter_state: JSON.stringify({
                activeTagFilters: [],
                genreFilter: 'Techno',
                globalSearch: '',
                keyFilter: null,
                ratingFilter: null,
            }),
            id: 10,
            name: 'Set',
        });
        s.playlist_tracks.push({ playlist_id: 10, position: 0, track_id: 1 });

        const tracksStore = useTracksStore();
        tracksStore.allTracks = [
            makeStoreTrack(1, { genre: 'Techno' }),
            makeStoreTrack(2, { genre: 'Techno' }),
            makeStoreTrack(3, { genre: 'Techno' }),
        ];

        const view = usePlaylistView();
        await view.openPlaylist({
            createdAt: new Date().toISOString(),
            description: '',
            filterState: {
                activeTagFilters: [],
                genreFilter: 'Techno',
                globalSearch: '',
                keyFilter: null,
                ratingFilter: null,
            },
            id: 10,
            name: 'Set',
            trackCount: 1,
        });

        expect(view.suggestedTracks.value).toHaveLength(3);

        view.applySuggestedUpdate();

        expect(view.playlistTracks.value).toHaveLength(3);
        expect(view.suggestedTracks.value).toBeNull();
        expect(view.hasPendingUpdate.value).toBe(true);
    });
});

// ── removeTrack + updatePlaylist ──────────────────────────────────────────────

describe('removeTrack and updatePlaylist', () => {
    it('removeTrack removes the track from playlistTracks immediately', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2));
        s.playlists.push({
            created_at: new Date().toISOString(),
            description: '',
            filter_state: null,
            id: 10,
            name: 'Set',
        });
        s.playlist_tracks.push(
            { playlist_id: 10, position: 0, track_id: 1 },
            { playlist_id: 10, position: 1, track_id: 2 },
        );

        const view = usePlaylistView();
        await view.openPlaylist({
            createdAt: new Date().toISOString(),
            description: '',
            filterState: null,
            id: 10,
            name: 'Set',
            trackCount: 2,
        });

        view.removeTrack(1);

        expect(view.playlistTracks.value).toHaveLength(1);
        expect(view.playlistTracks.value[0].id).toBe(2);
        expect(view.hasRemovals.value).toBe(true);
    });

    // oxlint-disable-next-line max-statements
    it('updatePlaylist persists the new track order and clears pending state', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3));
        s.playlists.push({
            created_at: new Date().toISOString(),
            description: '',
            filter_state: null,
            id: 10,
            name: 'Set',
        });
        s.playlist_tracks.push(
            { playlist_id: 10, position: 0, track_id: 1 },
            { playlist_id: 10, position: 1, track_id: 2 },
            { playlist_id: 10, position: 2, track_id: 3 },
        );

        const view = usePlaylistView();
        await view.openPlaylist({
            createdAt: new Date().toISOString(),
            description: '',
            filterState: null,
            id: 10,
            name: 'Set',
            trackCount: 3,
        });

        // Remove track 2
        view.removeTrack(2);

        await view.updatePlaylist([1, 3]);

        // DB should now have tracks 1 and 3 only
        const ptIds = s.playlist_tracks
            .filter((pt) => pt.playlist_id === 10)
            .toSorted((a, b) => a.position - b.position)
            .map((pt) => pt.track_id);
        expect(ptIds).toEqual([1, 3]);

        expect(view.hasRemovals.value).toBe(false);
        expect(view.hasPendingUpdate.value).toBe(false);
    });
});

// ── loadPlaylists ─────────────────────────────────────────────────────────────

describe('usePlaylistsStore.loadPlaylists', () => {
    it('returns playlists with correct track counts', async () => {
        s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3));
        s.playlists.push(
            {
                created_at: '2024-01-01T00:00:00.000Z',
                description: '',
                filter_state: null,
                id: 1,
                name: 'Set A',
            },
            {
                created_at: '2024-01-02T00:00:00.000Z',
                description: '',
                filter_state: null,
                id: 2,
                name: 'Set B',
            },
        );
        s.playlist_tracks.push(
            { playlist_id: 1, position: 0, track_id: 1 },
            { playlist_id: 1, position: 1, track_id: 2 },
            { playlist_id: 2, position: 0, track_id: 3 },
        );

        const playlistsStore = usePlaylistsStore();
        await playlistsStore.loadPlaylists();

        expect(playlistsStore.playlists).toHaveLength(2);
        const setA = playlistsStore.playlists.find((p) => p.name === 'Set A');
        const setB = playlistsStore.playlists.find((p) => p.name === 'Set B');
        expect(setA?.trackCount).toBe(2);
        expect(setB?.trackCount).toBe(1);
    });

    it('parses filter_state JSON correctly', async () => {
        const fs = {
            activeTagFilters: ['techno'],
            genreFilter: null,
            globalSearch: 'test',
            keyFilter: null,
            ratingFilter: null,
        };
        s.playlists.push({
            created_at: '2024-01-01T00:00:00.000Z',
            description: '',
            filter_state: JSON.stringify(fs),
            id: 1,
            name: 'Filtered',
        });

        const playlistsStore = usePlaylistsStore();
        await playlistsStore.loadPlaylists();

        expect(playlistsStore.playlists[0].filterState).toEqual(fs);
    });
});
