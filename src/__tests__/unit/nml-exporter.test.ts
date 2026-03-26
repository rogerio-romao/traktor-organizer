// oxlint-disable max-lines-per-function

import { describe, expect, it } from 'vitest';

import { buildPlaylistNml } from '@/services/nml-exporter';

import type { TrackRow } from '@/types/track';

function makeTrack(overrides: Partial<TrackRow> = {}): TrackRow {
    return {
        album: 'Test Album',
        artist: 'Test Artist',
        audioId: '',
        bitrate: 320,
        bpm: 128,
        bpmQuality: 100,
        catalogNo: '',
        color: null,
        commentRaw: '',
        coverArtId: '',
        duration: 360,
        durationFloat: 360.5,
        fileName: 'track.mp3',
        filePath: '/path/to/track.mp3',
        filesize: 1_000_000,
        flags: null,
        genre: 'House',
        id: 1,
        importDate: '',
        keyLyrics: '',
        label: 'Test Label',
        lastPlayed: '',
        loudnessAnalyzed: -7,
        loudnessPeak: -0.5,
        loudnessPerceived: -6,
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
        title: 'Test Title',
        ...overrides,
    };
}

describe('buildPlaylistNml', () => {
    it('outputs parseable XML containing expected track fields', () => {
        const tracks = [makeTrack({ artist: 'DJ Test', title: 'My Track' })];
        const xml = buildPlaylistNml('Test Playlist', tracks);

        expect(xml).toContain('TITLE="My Track"');
        expect(xml).toContain('ARTIST="DJ Test"');
        expect(xml).toContain('<COLLECTION ENTRIES="1">');
    });

    it('converts stars to ranking (rating * 51)', () => {
        const tracks = [makeTrack({ rating: 3 })];
        const xml = buildPlaylistNml('Test', tracks);

        expect(xml).toContain('RANKING="153"');
    });

    it('serialises tags into COMMENT attribute', () => {
        const tracks = [
            makeTrack({
                commentRaw: 'original',
                tags: ['deep-house', 'techno'],
            }),
        ];
        const xml = buildPlaylistNml('Test', tracks);

        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const info = doc.querySelector('INFO');
        expect(info?.getAttribute('COMMENT')).toBe('deep-house techno');
    });

    it('uses commentRaw when no tags', () => {
        const tracks = [makeTrack({ commentRaw: 'my comment', tags: [] })];
        const xml = buildPlaylistNml('Test', tracks);

        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const info = doc.querySelector('INFO');
        expect(info?.getAttribute('COMMENT')).toBe('my comment');
    });

    it('escapes <, >, &, " in title/artist fields', () => {
        const tracks = [
            makeTrack({
                artist: 'Artist &amp; More',
                title: 'Test <tag> & "quotes"',
            }),
        ];
        const xml = buildPlaylistNml('Test', tracks);

        expect(xml).toContain('&lt;tag&gt;');
        expect(xml).toContain('&amp; &quot;quotes&quot;');
        expect(xml).toContain('&amp;amp; More');
    });

    it('escapes playlist name', () => {
        const tracks = [makeTrack()];
        const xml = buildPlaylistNml('My <Playlist> & "Test"', tracks);

        expect(xml).toContain('&lt;Playlist&gt;');
        expect(xml).toContain('&amp; &quot;Test&quot;');
    });

    it('includes correct entry count in COLLECTION and PLAYLIST', () => {
        const tracks = [makeTrack(), makeTrack({ id: 2, title: 'Track 2' })];
        const xml = buildPlaylistNml('Test', tracks);

        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const collection = doc.querySelector('COLLECTION');
        const playlist = doc.querySelector('PLAYLIST');
        expect(collection?.getAttribute('ENTRIES')).toBe('2');
        expect(playlist?.getAttribute('ENTRIES')).toBe('2');
    });

    it('handles empty tracks array', () => {
        const xml = buildPlaylistNml('Empty', []);

        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const collection = doc.querySelector('COLLECTION');
        expect(collection?.getAttribute('ENTRIES')).toBe('0');
    });

    it('omits null/undefined optional attributes', () => {
        const tracks = [
            makeTrack({
                bitrate: null,
                bpm: null,
                bpmQuality: null,
                musicalKeyValue: null,
            }),
        ];
        const xml = buildPlaylistNml('Test', tracks);

        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const tempo = doc.querySelector('TEMPO');
        const musicalKey = doc.querySelector('MUSICAL_KEY');
        const info = doc.querySelector('INFO');

        expect(tempo).toBeNull();
        expect(musicalKey).toBeNull();
        expect(info?.getAttribute('BITRATE')).toBeNull();
    });
});
