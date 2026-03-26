// oxlint-disable max-lines

import { createDbState } from './helpers/db-stub';
import { useTracksStore } from '@/stores/tracks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// addToTagBlocklist lives on the database service, not the store —
// the store has no wrapper method for it, so we call it directly here.
import { addToTagBlocklist } from '@/services/database';

import type { DbState } from './helpers/db-stub';
import type { TrackDbRow, TrackRow } from '@/types/track';

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState;

vi.mock('@/services/database', async () => {
    const { makeDbMock } = await import('./helpers/db-stub');
    return makeDbMock(() => s);
});

// Seed helpers
function seedTrack(id: number, overrides: Partial<TrackDbRow> = {}): void {
    s.tracks.push({
        album: '',
        artist: 'Artist',
        audio_id: '',
        bitrate: null,
        bpm: 128,
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
        genre: 'House',
        id,
        import_date: '',
        key_lyrics: '',
        label: '',
        last_played: '',
        loudness_analyzed: null,
        loudness_peak: null,
        loudness_perceived: null,
        mix: '',
        musical_key: '1m',
        musical_key_value: 0,
        nml_dir: '/music/',
        nml_file: `track${id}.mp3`,
        nml_volume: 'osx',
        nml_volume_id: 'osx',
        play_count: 0,
        producer: '',
        rating: 3,
        release_date: '',
        remixer: '',
        title: `Track ${id}`,
        ...overrides,
    });
}

function seedTag(id: number, name: string): void {
    s.tags.push({ id, name });
}

function seedTrackTag(trackId: number, tagId: number): void {
    s.track_tags.push({ tag_id: tagId, track_id: trackId });
}

beforeEach(() => {
    s = createDbState();
    setActivePinia(createPinia());
});

// ── addTagToTrack ─────────────────────────────────────────────────────────────

// oxlint-disable-next-line max-lines-per-function
describe('addTagToTrack', () => {
    it('creates a new tag row and links it to the track', async () => {
        seedTrack(1);
        const store = useTracksStore();
        store.allTracks = [
            {
                album: '',
                artist: 'Artist',
                audioId: '',
                bitrate: null,
                bpm: 128,
                bpmQuality: null,
                catalogNo: '',
                color: null,
                commentRaw: '',
                coverArtId: '',
                duration: 300,
                durationFloat: 300,
                fileName: 'track1.mp3',
                filePath: '/music/track1.mp3',
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
                musicalKey: '1m',
                musicalKeyValue: 0,
                nmlDir: '/music/',
                nmlFile: 'track1.mp3',
                nmlVolume: 'osx',
                nmlVolumeId: 'osx',
                playCount: 0,
                producer: '',
                rating: 3,
                releaseDate: '',
                remixer: '',
                tags: [],
                title: 'Track 1',
            },
        ];

        await store.addTagToTrack(1, 'techno');

        expect(s.tags).toHaveLength(1);
        expect(s.tags[0].name).toBe('techno');
        expect(s.track_tags).toHaveLength(1);
        expect(s.track_tags[0]).toMatchObject({
            tag_id: s.tags[0].id,
            track_id: 1,
        });
    });

    it('normalises the tag name before inserting', async () => {
        seedTrack(1);
        const store = useTracksStore();
        store.allTracks = [{ id: 1, tags: [] } as unknown as TrackRow];

        await store.addTagToTrack(1, 'TECHNO');

        expect(s.tags[0].name).toBe('techno');
    });

    it('reuses an existing tag and does not duplicate it', async () => {
        seedTrack(1);
        seedTag(10, 'house');

        const store = useTracksStore();
        store.allTracks = [{ id: 1, tags: [] } as unknown as TrackRow];

        await store.addTagToTrack(1, 'house');

        expect(s.tags).toHaveLength(1); // no new tag row
        expect(s.track_tags[0].tag_id).toBe(10);
    });

    it('mutates the in-memory TrackRow tags array immediately', async () => {
        seedTrack(1);
        const store = useTracksStore();
        const track = { id: 1, tags: [] } as unknown as TrackRow;
        store.allTracks = [track];

        await store.addTagToTrack(1, 'peak-time');

        expect(track.tags).toContain('peak-time');
    });

    it('does nothing if the tag normalises to an empty string', async () => {
        seedTrack(1);
        const store = useTracksStore();
        store.allTracks = [{ id: 1, tags: [] } as unknown as TrackRow];

        await store.addTagToTrack(1, '!!!'); // only disallowed chars → empty after normalise

        expect(s.tags).toHaveLength(0);
        expect(s.track_tags).toHaveLength(0);
    });
});

// ── removeTagFromTrack ────────────────────────────────────────────────────────

describe('removeTagFromTrack', () => {
    it('removes the track_tag link', async () => {
        seedTrack(1);
        seedTag(5, 'techno');
        seedTrackTag(1, 5);

        const store = useTracksStore();
        store.allTracks = [{ id: 1, tags: ['techno'] } as unknown as TrackRow];

        await store.removeTagFromTrack(1, 'techno');

        expect(s.track_tags).toHaveLength(0);
    });

    it('deletes an orphaned tag from the tags table', async () => {
        seedTrack(1);
        seedTag(5, 'techno');
        seedTrackTag(1, 5);

        const store = useTracksStore();
        store.allTracks = [{ id: 1, tags: ['techno'] } as unknown as TrackRow];

        await store.removeTagFromTrack(1, 'techno');

        expect(s.tags).toHaveLength(0);
    });

    it('keeps a tag that is still used by another track', async () => {
        seedTrack(1);
        seedTrack(2);
        seedTag(5, 'techno');
        seedTrackTag(1, 5);
        seedTrackTag(2, 5);

        const store = useTracksStore();
        store.allTracks = [
            { id: 1, tags: ['techno'] } as unknown as TrackRow,
            { id: 2, tags: ['techno'] } as unknown as TrackRow,
        ];

        await store.removeTagFromTrack(1, 'techno');

        expect(s.track_tags).toHaveLength(1);
        expect(s.tags).toHaveLength(1); // tag still exists
    });

    it('mutates the in-memory TrackRow tags array immediately', async () => {
        seedTrack(1);
        seedTag(5, 'techno');
        seedTrackTag(1, 5);

        const store = useTracksStore();
        const track = { id: 1, tags: ['techno'] } as unknown as TrackRow;
        store.allTracks = [track];

        await store.removeTagFromTrack(1, 'techno');

        expect(track.tags).not.toContain('techno');
    });
});

// ── addToTagBlocklist ─────────────────────────────────────────────────────────

describe('addToTagBlocklist', () => {
    it('removes the tag and all its track links', async () => {
        seedTrack(1);
        seedTrack(2);
        seedTag(5, 'vocal');
        seedTrackTag(1, 5);
        seedTrackTag(2, 5);

        await addToTagBlocklist('vocal');

        expect(s.track_tags).toHaveLength(0);
        expect(s.tags).toHaveLength(0);
    });

    it('adds the tag name to tag_blocklist', async () => {
        await addToTagBlocklist('vocal');

        expect(s.tag_blocklist.some((r) => r.name === 'vocal')).toBe(true);
    });

    it('is idempotent — calling twice does not duplicate the blocklist entry', async () => {
        await addToTagBlocklist('vocal');
        await addToTagBlocklist('vocal');

        expect(s.tag_blocklist.filter((r) => r.name === 'vocal')).toHaveLength(
            1,
        );
    });

    // oxlint-disable-next-line max-statements
    it('tag no longer appears on tracks after store reload', async () => {
        seedTrack(1);
        seedTrack(2);
        seedTag(5, 'vocal');
        seedTrackTag(1, 5);
        seedTrackTag(2, 5);

        const store = useTracksStore();
        await store.loadAllTracks();
        expect(store.allTracks[0].tags).toContain('vocal');

        await addToTagBlocklist('vocal');
        await store.loadAllTracks();

        expect(store.allTracks.every((t) => !t.tags.includes('vocal'))).toBe(
            true,
        );
    });
});
