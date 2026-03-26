// oxlint-disable max-lines

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTracksStore } from '@/stores/tracks';

import { createDbState } from './helpers/db-stub';

import type { TrackRow } from '@/types/track';
import type { DbState } from './helpers/db-stub';

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState;

vi.mock('../../services/database', async () => {
    const { makeDbMock } = await import('./helpers/db-stub');
    return makeDbMock(() => s);
});

function makeTrack(
    overrides: Partial<TrackRow> & Pick<TrackRow, 'id' | 'title' | 'artist'>,
): TrackRow {
    return {
        album: '',
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
        fileName: `${overrides.id}.mp3`,
        filePath: `/music/${overrides.id}.mp3`,
        filesize: null,
        flags: null,
        genre: 'Techno',
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
        nmlFile: `${overrides.id}.mp3`,
        nmlVolume: 'osx',
        nmlVolumeId: 'osx',
        playCount: 0,
        producer: '',
        rating: 3,
        releaseDate: '',
        remixer: '',
        tags: [],
        ...overrides,
    };
}

let store: ReturnType<typeof useTracksStore>;

beforeEach(() => {
    s = createDbState();
    setActivePinia(createPinia());
    store = useTracksStore();
});

// ── Tag filters ───────────────────────────────────────────────────────────────

describe('tag filters', () => {
    it('adding a tag filter returns only tracks that have that tag', () => {
        store.allTracks = [
            makeTrack({
                artist: 'X',
                id: 1,
                tags: ['techno', 'dark'],
                title: 'A',
            }),
            makeTrack({ artist: 'Y', id: 2, tags: ['house'], title: 'B' }),
            makeTrack({ artist: 'Z', id: 3, tags: ['techno'], title: 'C' }),
        ];

        store.activeTagFilters = ['techno'];

        expect(store.filteredTracks).toHaveLength(2);
        expect(store.filteredTracks.map((t) => t.id)).toEqual(expect.arrayContaining([1, 3]));
    });

    it('uses AND semantics — track must have ALL active tag filters', () => {
        store.allTracks = [
            makeTrack({
                artist: 'X',
                id: 1,
                tags: ['techno', 'dark'],
                title: 'A',
            }),
            makeTrack({ artist: 'Y', id: 2, tags: ['techno'], title: 'B' }),
        ];

        store.activeTagFilters = ['techno', 'dark'];

        expect(store.filteredTracks).toHaveLength(1);
        expect(store.filteredTracks[0].id).toBe(1);
    });

    it('removing a tag filter updates filteredTracks reactively', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', id: 1, tags: ['techno'], title: 'A' }),
            makeTrack({ artist: 'Y', id: 2, tags: ['house'], title: 'B' }),
        ];
        store.activeTagFilters = ['techno'];
        expect(store.filteredTracks).toHaveLength(1);

        store.activeTagFilters = [];
        expect(store.filteredTracks).toHaveLength(2);
    });
});

// ── Search filter ─────────────────────────────────────────────────────────────

describe('globalSearch', () => {
    it('matches title case-insensitively', () => {
        store.allTracks = [
            makeTrack({ artist: 'New Order', id: 1, title: 'Blue Monday' }),
            makeTrack({ artist: 'Basement Jaxx', id: 2, title: 'Red Alert' }),
        ];

        store.globalSearch = 'blue';

        expect(store.filteredTracks).toHaveLength(1);
        expect(store.filteredTracks[0].id).toBe(1);
    });

    it('matches artist', () => {
        store.allTracks = [
            makeTrack({ artist: 'Aphex Twin', id: 1, title: 'Track A' }),
            makeTrack({ artist: 'Orbital', id: 2, title: 'Track B' }),
        ];

        store.globalSearch = 'aphex';

        expect(store.filteredTracks).toHaveLength(1);
        expect(store.filteredTracks[0].id).toBe(1);
    });

    it('matches genre', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', genre: 'Techno', id: 1, title: 'A' }),
            makeTrack({ artist: 'Y', genre: 'House', id: 2, title: 'B' }),
        ];

        store.globalSearch = 'house';

        expect(store.filteredTracks).toHaveLength(1);
        expect(store.filteredTracks[0].id).toBe(2);
    });

    it('matches tag text', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', id: 1, tags: ['peak-time'], title: 'A' }),
            makeTrack({ artist: 'Y', id: 2, tags: ['warm-up'], title: 'B' }),
        ];

        store.globalSearch = 'peak';

        expect(store.filteredTracks).toHaveLength(1);
        expect(store.filteredTracks[0].id).toBe(1);
    });

    it('whitespace-only search returns full list', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', id: 1, title: 'A' }),
            makeTrack({ artist: 'Y', id: 2, title: 'B' }),
        ];

        store.globalSearch = '   ';

        expect(store.filteredTracks).toHaveLength(2);
    });
});

// ── Genre / key / rating filters ─────────────────────────────────────────────

describe('genre, key, and rating filters', () => {
    it('genreFilter does a case-insensitive exact match', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', genre: 'Techno', id: 1, title: 'A' }),
            makeTrack({ artist: 'Y', genre: 'House', id: 2, title: 'B' }),
            makeTrack({ artist: 'Z', genre: 'techno', id: 3, title: 'C' }),
        ];

        store.genreFilter = 'techno';

        expect(store.filteredTracks).toHaveLength(2);
        expect(store.filteredTracks.map((t) => t.id)).toEqual(expect.arrayContaining([1, 3]));
    });

    it('keyFilter does an exact match', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', id: 1, musicalKey: '4d', title: 'A' }),
            makeTrack({ artist: 'Y', id: 2, musicalKey: '5m', title: 'B' }),
        ];

        store.keyFilter = '4d';

        expect(store.filteredTracks).toHaveLength(1);
        expect(store.filteredTracks[0].id).toBe(1);
    });

    it('ratingFilter returns tracks with at least the given star count', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', id: 1, rating: 5, title: 'A' }),
            makeTrack({ artist: 'Y', id: 2, rating: 3, title: 'B' }),
            makeTrack({ artist: 'Z', id: 3, rating: 1, title: 'C' }),
        ];

        store.ratingFilter = 3;

        expect(store.filteredTracks).toHaveLength(2);
        expect(store.filteredTracks.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2]));
    });
});

// ── Composition and reset ─────────────────────────────────────────────────────

describe('filter composition and clearFilters', () => {
    it('composing search + genre + rating filters narrows results correctly', () => {
        store.allTracks = [
            makeTrack({
                artist: 'Dj A',
                genre: 'Techno',
                id: 1,
                rating: 5,
                title: 'Midnight',
            }),
            makeTrack({
                artist: 'Dj A',
                genre: 'Techno',
                id: 2,
                rating: 2,
                title: 'Sunrise',
            }),
            makeTrack({
                artist: 'Dj B',
                genre: 'House',
                id: 3,
                rating: 5,
                title: 'Midnight Blues',
            }),
        ];

        store.globalSearch = 'midnight';
        store.genreFilter = 'Techno';
        store.ratingFilter = 4;

        expect(store.filteredTracks).toHaveLength(1);
        expect(store.filteredTracks[0].id).toBe(1);
    });

    // oxlint-disable-next-line max-statements
    it('clearFilters resets all filters and returns the full collection', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', id: 1, title: 'A' }),
            makeTrack({ artist: 'Y', id: 2, title: 'B' }),
        ];

        store.globalSearch = 'A';
        store.activeTagFilters = ['techno'];
        store.genreFilter = 'House';
        store.ratingFilter = 4;

        store.clearFilters();

        expect(store.globalSearch).toBe('');
        expect(store.activeTagFilters).toEqual([]);
        expect(store.genreFilter).toBeNull();
        expect(store.ratingFilter).toBeNull();
        expect(store.filteredTracks).toHaveLength(2);
    });

    it('empty filters return the full input array unchanged', () => {
        store.allTracks = [
            makeTrack({ artist: 'X', id: 1, title: 'A' }),
            makeTrack({ artist: 'Y', id: 2, title: 'B' }),
        ];

        expect(store.filteredTracks).toHaveLength(2);
    });
});

// ── loadAllTracks reads from DB and builds the track-tag map ─────────────────

// oxlint-disable-next-line max-lines-per-function
describe('loadAllTracks', () => {
    it('loads tracks from the DB and attaches tags via the tag map', async () => {
        s.tracks.push({
            album: '',
            artist: 'DB Artist',
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
            file_name: 'db.mp3',
            file_path: '/music/db.mp3',
            filesize: null,
            flags: null,
            genre: 'Techno',
            id: 1,
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
            nml_file: 'db.mp3',
            nml_volume: 'osx',
            nml_volume_id: 'osx',
            play_count: 0,
            producer: '',
            rating: 4,
            release_date: '',
            remixer: '',
            title: 'DB Track',
        });
        s.tags.push({ id: 1, name: 'techno' });
        s.track_tags.push({ tag_id: 1, track_id: 1 });

        await store.loadAllTracks();

        expect(store.allTracks).toHaveLength(1);
        expect(store.allTracks[0].title).toBe('DB Track');
        expect(store.allTracks[0].tags).toEqual(['techno']);
    });

    it('excludes tracks whose artist is in the blocklist', async () => {
        s.tracks.push(
            {
                album: '',
                artist: 'Good Artist',
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
                file_name: 'a.mp3',
                file_path: '/a.mp3',
                filesize: null,
                flags: null,
                genre: 'Techno',
                id: 1,
                import_date: '',
                key_lyrics: '',
                label: '',
                last_played: '',
                loudness_analyzed: null,
                loudness_peak: null,
                loudness_perceived: null,
                mix: '',
                musical_key: '',
                musical_key_value: null,
                nml_dir: '/',
                nml_file: 'a.mp3',
                nml_volume: 'osx',
                nml_volume_id: 'osx',
                play_count: 0,
                producer: '',
                rating: 0,
                release_date: '',
                remixer: '',
                title: 'Good Track',
            },
            {
                album: '',
                artist: 'Blocked Artist',
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
                file_name: 'b.mp3',
                file_path: '/b.mp3',
                filesize: null,
                flags: null,
                genre: 'Techno',
                id: 2,
                import_date: '',
                key_lyrics: '',
                label: '',
                last_played: '',
                loudness_analyzed: null,
                loudness_peak: null,
                loudness_perceived: null,
                mix: '',
                musical_key: '',
                musical_key_value: null,
                nml_dir: '/',
                nml_file: 'b.mp3',
                nml_volume: 'osx',
                nml_volume_id: 'osx',
                play_count: 0,
                producer: '',
                rating: 0,
                release_date: '',
                remixer: '',
                title: 'Blocked Track',
            },
        );
        s.track_blocklist.push({ artist_name: 'Blocked Artist' });

        await store.loadAllTracks();

        expect(store.allTracks).toHaveLength(1);
        expect(store.allTracks[0].artist).toBe('Good Artist');
    });
});
