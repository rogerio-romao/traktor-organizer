import { describe, expect, it } from 'vitest';

import { filterTracks } from '@/utils/filterTracks';
import type { TrackRow } from '@/types/track';

function makeTrack(overrides: Partial<TrackRow> = {}): TrackRow {
    return {
        album: 'Test Album',
        artist: 'Test Artist',
        audioId: '',
        bitrate: null,
        bpm: 128,
        bpmQuality: null,
        catalogNo: '',
        color: null,
        commentRaw: '',
        coverArtId: '',
        duration: 360,
        durationFloat: null,
        fileName: 'track.mp3',
        filePath: '/path/to/track.mp3',
        filesize: null,
        flags: null,
        genre: 'House',
        id: 1,
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
        nmlDir: '/:path/:to/:',
        nmlFile: 'track.mp3',
        nmlVolume: 'osx',
        nmlVolumeId: 'osx',
        playCount: 0,
        producer: '',
        rating: 3,
        releaseDate: '',
        remixer: '',
        tags: [],
        title: 'Test Track',
        ...overrides,
    };
}

// oxlint-disable-next-line max-lines-per-function, max-statements
describe('filterTracks', () => {
    const tracks = [
        makeTrack({
            album: 'Midnight',
            artist: 'DJ Synth',
            genre: 'Techno',
            id: 1,
            musicalKey: '5m',
            rating: 4,
            tags: ['dark', 'night'],
            title: 'Night Drive',
        }),
        makeTrack({
            album: 'Dawn',
            artist: 'Morning Crew',
            genre: 'House',
            id: 2,
            musicalKey: '4d',
            rating: 2,
            tags: ['uplifting', 'morning'],
            title: 'Sunrise',
        }),
        makeTrack({
            album: 'Abyss',
            artist: 'Deep DJ',
            genre: 'Deep House',
            id: 3,
            musicalKey: '6m',
            rating: 5,
            tags: ['dark', 'deep'],
            title: 'Deep Thoughts',
        }),
        makeTrack({
            album: 'Factory',
            artist: 'Techno King',
            genre: 'Techno',
            id: 4,
            musicalKey: '10m',
            rating: 1,
            tags: [],
            title: 'Techno Thing',
        }),
    ];

    it('returns full input when no filters active', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: [],
            genreFilter: null,
            globalSearch: '',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(4);
    });

    it('filters by global search (case-insensitive partial match on title, artist, album, genre)', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: [],
            genreFilter: null,
            globalSearch: 'techno',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual([1, 4]);
    });

    it('global search matches tags', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: [],
            genreFilter: null,
            globalSearch: 'dark',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual([1, 3]);
    });

    it('filters by genre (case-insensitive exact match)', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: [],
            genreFilter: 'techno',
            globalSearch: '',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual([1, 4]);
    });

    it('filters by key (exact match)', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: [],
            genreFilter: null,
            globalSearch: '',
            keyFilter: '5m',
            ratingFilter: null,
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('filters by rating (minimum threshold)', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: [],
            genreFilter: null,
            globalSearch: '',
            keyFilter: null,
            ratingFilter: 3,
        });
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual([1, 3]);
    });

    it('filters by tags using AND semantics', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: ['dark'],
            genreFilter: null,
            globalSearch: '',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual([1, 3]);
    });

    it('tags AND requires all tags present', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: ['dark', 'night'],
            genreFilter: null,
            globalSearch: '',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('filters compose correctly (multiple filters)', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: ['dark'],
            genreFilter: 'techno',
            globalSearch: '',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('handles empty tracks array', () => {
        const result = filterTracks([], {
            activeTagFilters: [],
            genreFilter: null,
            globalSearch: 'test',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(0);
    });

    it('handles whitespace-only global search as empty', () => {
        const result = filterTracks(tracks, {
            activeTagFilters: [],
            genreFilter: null,
            globalSearch: '   ',
            keyFilter: null,
            ratingFilter: null,
        });
        expect(result).toHaveLength(4);
    });
});
