// oxlint-disable max-lines

/**
 * In-memory DB stub for integration tests.
 *
 * Usage per test file:
 *   let s: DbState
 *   vi.mock('../../services/database', () => makeDbMock(() => s))
 *   beforeEach(() => { s = createDbState() })
 *
 * The getter form `() => s` is required so the closure always reads the
 * current DbState after it is reassigned in beforeEach.
 */

import type { TrackDbRow } from '@/types/track';

type SqlParam = string | number | null;
type TrackStubRow = TrackDbRow & { app_import_date?: string };

interface TagRow {
    id: number;
    name: string;
}
interface TrackTagRow {
    track_id: number;
    tag_id: number;
}
interface PlaylistRow {
    id: number;
    name: string;
    description: string;
    filter_state: string | null;
    created_at: string;
}
interface PlaylistTrackRow {
    playlist_id: number;
    track_id: number;
    position: number;
}
interface SettingRow {
    key: string;
    value: string;
}
interface TagBlocklistRow {
    name: string;
}
interface TrackBlocklistRow {
    artist_name: string;
}

function nextId(rows: { id?: number }[]): number {
    return rows.length === 0 ? 1 : Math.max(...rows.map((r) => r.id ?? 0)) + 1;
}

// ── SQL execute handler ────────────────────────────────────────────────────

// oxlint-disable-next-line max-lines-per-function,  complexity, max-statements
function handleExecute(
    s: DbState,
    sql: string,
    params: SqlParam[],
): { rowsAffected: number; lastInsertId?: number } {
    const sl = sql.replaceAll(/\s+/g, ' ').trim().toLowerCase();
    const p = params ?? [];

    // Big UPDATE from upsertTrack (file_path = $30)
    if (
        sl.startsWith('update tracks set') &&
        sl.includes('where file_path = $30')
    ) {
        // params: p[0]=title…p[2]=album, p[3]=bpm…p[5]=musicalKeyValue,
        //         p[6]=duration, p[7]=durationFloat, p[8]=label…p[11]=releaseDate,
        //         p[12]=mix…p[15]=filesize, p[16]=playCount…p[18]=color,
        //         p[19..21]=loudness, p[22..24]=bpmQuality/keyLyrics/flags,
        //         p[25]=coverArtId, p[26]=commentRaw, p[27]=importDate, p[28]=audioId,
        //         p[29]=filePath
        const track = s.tracks.find((t) => t.file_path === p[29]);
        if (!track) return { rowsAffected: 0 };
        const updates: Partial<TrackDbRow> = {
            album: p[2] as string,
            artist: p[1] as string,
            audio_id: p[28] as string,
            bitrate: p[14] as number | null,
            bpm: p[3] as number | null,
            bpm_quality: p[22] as number | null,
            catalog_no: p[13] as string,
            color: p[18] as number | null,
            comment_raw: p[26] as string,
            cover_art_id: p[25] as string,
            duration: p[6] as number,
            duration_float: p[7] as number | null,
            filesize: p[15] as number | null,
            flags: p[24] as number | null,
            import_date: p[27] as string,
            key_lyrics: p[23] as string,
            label: p[8] as string,
            last_played: p[17] as string,
            loudness_analyzed: p[21] as number | null,
            loudness_peak: p[19] as number | null,
            loudness_perceived: p[20] as number | null,
            mix: p[12] as string,
            musical_key: p[4] as string,
            musical_key_value: p[5] as number | null,
            play_count: p[16] as number,
            producer: p[10] as string,
            release_date: p[11] as string,
            remixer: p[9] as string,
            title: p[0] as string,
        };
        const changed = (Object.keys(updates) as (keyof TrackDbRow)[]).some(
            (k) => track[k] !== updates[k],
        );
        if (!changed) return { rowsAffected: 0 };
        Object.assign(track, updates);
        return { rowsAffected: 1 };
    }

    // Simple single-field UPDATE for inline edits — WHERE id = $2
    if (
        sl.startsWith('update tracks set title') &&
        sl.includes('where id = $2')
    ) {
        const t = s.tracks.find((r) => r.id === p[1]);
        if (t) {
            t.title = p[0] as string;
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }
    if (
        sl.startsWith('update tracks set artist') &&
        sl.includes('where id = $2')
    ) {
        const t = s.tracks.find((r) => r.id === p[1]);
        if (t) {
            t.artist = p[0] as string;
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }
    if (
        sl.startsWith('update tracks set genre') &&
        sl.includes('where id = $2')
    ) {
        const t = s.tracks.find((r) => r.id === p[1]);
        if (t) {
            t.genre = p[0] as string;
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }
    if (
        sl.startsWith('update tracks set rating') &&
        sl.includes('where id = $2')
    ) {
        const t = s.tracks.find((r) => r.id === p[1]);
        if (t) {
            t.rating = p[0] as number;
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }

    // INSERT INTO tracks (big insert from upsertTrack)
    if (sl.startsWith('insert into tracks')) {
        const id = nextId(s.tracks);
        s.tracks.push({
            album: p[2] as string,
            app_import_date: new Date().toISOString(),
            artist: p[1] as string,
            audio_id: p[36] as string,
            bitrate: p[16] as number | null,
            bpm: p[4] as number | null,
            bpm_quality: p[24] as number | null,
            catalog_no: p[15] as string,
            color: p[20] as number | null,
            comment_raw: p[34] as string,
            cover_art_id: p[33] as string,
            duration: p[7] as number,
            duration_float: p[8] as number | null,
            file_name: p[28] as string,
            file_path: p[27] as string,
            filesize: p[17] as number | null,
            flags: p[26] as number | null,
            genre: p[3] as string,
            id,
            import_date: p[35] as string,
            key_lyrics: p[25] as string,
            label: p[10] as string,
            last_played: p[19] as string,
            loudness_analyzed: p[23] as number | null,
            loudness_peak: p[21] as number | null,
            loudness_perceived: p[22] as number | null,
            mix: p[14] as string,
            musical_key: p[5] as string,
            musical_key_value: p[6] as number | null,
            nml_dir: p[29] as string,
            nml_file: p[30] as string,
            nml_volume: p[31] as string,
            nml_volume_id: p[32] as string,
            play_count: p[18] as number,
            producer: p[12] as string,
            rating: p[9] as number,
            release_date: p[13] as string,
            remixer: p[11] as string,
            title: p[0] as string,
        });
        return { lastInsertId: id, rowsAffected: 1 };
    }

    // INSERT OR IGNORE INTO tags (name) VALUES ($1)
    if (sl.startsWith('insert or ignore into tags')) {
        const name = p[0];
        if (!s.tags.some((t) => t.name === name)) {
            const id = nextId(s.tags);
            s.tags.push({ id, name: name as string });
            return { lastInsertId: id, rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }

    // INSERT OR IGNORE INTO track_tags (track_id, tag_id) VALUES ($1, $2)
    if (
        sl.startsWith('insert or ignore into track_tags') &&
        sl.includes('values')
    ) {
        const [trackId, tagId] = [p[0] as number, p[1] as number];
        const exists = s.track_tags.find(
            (tt) => tt.track_id === trackId && tt.tag_id === tagId,
        );
        if (!exists) {
            s.track_tags.push({ tag_id: tagId, track_id: trackId });
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }

    // INSERT OR IGNORE INTO track_tags (...) SELECT $1, id FROM tags WHERE name = $2
    if (
        sl.startsWith('insert or ignore into track_tags') &&
        sl.includes('select')
    ) {
        const [trackId, tagName] = [p[0] as number, p[1] as string];
        const tag = s.tags.find((t) => t.name === tagName);
        if (!tag) return { rowsAffected: 0 };
        const exists = s.track_tags.find(
            (tt) => tt.track_id === trackId && tt.tag_id === tag.id,
        );
        if (!exists) {
            s.track_tags.push({ tag_id: tag.id, track_id: trackId });
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }

    // DELETE FROM track_tags WHERE track_id = $1 AND tag_id = (SELECT id FROM tags WHERE name = $2)
    if (
        sl.startsWith('delete from track_tags') &&
        sl.includes('where track_id = $1')
    ) {
        const tag = s.tags.find((t) => t.name === p[1]);
        if (!tag) return { rowsAffected: 0 };
        const before = s.track_tags.length;
        s.track_tags = s.track_tags.filter(
            (tt) => !(tt.track_id === p[0] && tt.tag_id === tag.id),
        );
        return { rowsAffected: before - s.track_tags.length };
    }

    // DELETE FROM tags WHERE name = $1 AND NOT EXISTS (...) — orphan cleanup
    if (
        sl.startsWith('delete from tags where name = $1') &&
        sl.includes('not exists')
    ) {
        const tag = s.tags.find((t) => t.name === p[0]);
        if (!tag) return { rowsAffected: 0 };
        const hasLinks = s.track_tags.some((tt) => tt.tag_id === tag.id);
        if (!hasLinks) {
            s.tags = s.tags.filter((t) => t.name !== p[0]);
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }

    // DELETE FROM playlist_tracks WHERE playlist_id = $1
    if (sl.startsWith('delete from playlist_tracks')) {
        const before = s.playlist_tracks.length;
        s.playlist_tracks = s.playlist_tracks.filter(
            (pt) => pt.playlist_id !== p[0],
        );
        return { rowsAffected: before - s.playlist_tracks.length };
    }

    // INSERT INTO playlist_tracks (playlist_id, track_id, position)
    if (
        sl.startsWith('insert into playlist_tracks') ||
        (sl.includes('into playlist_tracks') && sl.includes('values'))
    ) {
        const [pid, tid, pos] = [
            p[0] as number,
            p[1] as number,
            p[2] as number,
        ];
        const exists = s.playlist_tracks.find(
            (pt) => pt.playlist_id === pid && pt.track_id === tid,
        );
        if (!exists) {
            s.playlist_tracks.push({
                playlist_id: pid,
                position: pos,
                track_id: tid,
            });
            return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
    }

    return { rowsAffected: 0 };
}

// ── SQL select handler ─────────────────────────────────────────────────────

// oxlint-disable-next-line max-statements
function handleSelect(s: DbState, sql: string, params: SqlParam[]): object[] {
    const sl = sql.replaceAll(/\s+/g, ' ').trim().toLowerCase();
    const p = params ?? [];

    // loadAllTracks: SELECT * FROM tracks WHERE artist NOT IN (SELECT artist_name FROM track_blocklist)
    if (sl.includes('from tracks') && sl.includes('artist not in')) {
        const blocklist = new Set(s.track_blocklist.map((r) => r.artist_name));
        return [...s.tracks]
            .filter((t) => !blocklist.has(t.artist))
            .toSorted((a, b) => {
                const cmp = (a.artist ?? '').localeCompare(b.artist ?? '');
                return cmp === 0
                    ? (a.title ?? '').localeCompare(b.title ?? '')
                    : cmp;
            });
    }

    // loadAllTracks tag join: SELECT tt.track_id, t.name FROM track_tags tt JOIN tags t (no WHERE)
    if (
        sl.includes('tt.track_id') &&
        sl.includes('track_tags tt') &&
        !sl.includes('where tt.track_id in')
    ) {
        return s.track_tags.map((tt) => {
            const tag = s.tags.find((t) => t.id === tt.tag_id);
            return { name: tag?.name ?? '', track_id: tt.track_id };
        });
    }

    // SELECT id FROM tracks WHERE file_path = $1
    if (sl.startsWith('select id from tracks where file_path')) {
        return s.tracks
            .filter((t) => t.file_path === p[0])
            .map((t) => ({ id: t.id }));
    }

    // SELECT id FROM tags WHERE name = $1
    if (sl.startsWith('select id from tags where name')) {
        return s.tags.filter((t) => t.name === p[0]).map((t) => ({ id: t.id }));
    }

    // loadPlaylists: SELECT p.id, p.name, ... FROM playlists p LEFT JOIN playlist_tracks
    if (
        sl.includes('from playlists p') &&
        sl.includes('left join playlist_tracks')
    ) {
        return [...s.playlists]
            .map((pl) => ({
                created_at: pl.created_at ?? new Date().toISOString(),
                description: pl.description ?? '',
                filter_state: pl.filter_state ?? null,
                id: pl.id,
                name: pl.name,
                track_count: s.playlist_tracks.filter(
                    (pt) => pt.playlist_id === pl.id,
                ).length,
            }))
            .toSorted((a, b) => b.created_at.localeCompare(a.created_at));
    }

    // loadPlaylistTracks tracks: SELECT t.* FROM tracks t JOIN playlist_tracks pt WHERE pt.playlist_id = $1
    if (
        sl.includes('from tracks t') &&
        sl.includes('join playlist_tracks pt')
    ) {
        const pts = s.playlist_tracks
            .filter((pt) => pt.playlist_id === p[0])
            .toSorted((a, b) => a.position - b.position);
        return pts
            .map((pt) => s.tracks.find((t) => t.id === pt.track_id))
            .filter(Boolean) as TrackStubRow[];
    }

    // loadPlaylistTracks tags: SELECT tt.track_id, tg.name ... WHERE tt.track_id IN (SELECT ...)
    if (sl.includes('track_tags tt') && sl.includes('where tt.track_id in')) {
        const trackIds = new Set(
            s.playlist_tracks
                .filter((pt) => pt.playlist_id === p[0])
                .map((pt) => pt.track_id),
        );
        return s.track_tags
            .filter((tt) => trackIds.has(tt.track_id))
            .map((tt) => {
                const tag = s.tags.find((t) => t.id === tt.tag_id);
                return { name: tag?.name ?? '', track_id: tt.track_id };
            });
    }

    return [];
}

// ── Factory helper for vi.mock ─────────────────────────────────────────────

/**
 * Creates the mock implementation for `../../services/database`.
 * Pass a getter so the closure always reads the current DbState (reassigned in beforeEach).
 *
 * Usage:
 *   let s: DbState
 *   vi.mock('../../services/database', () => makeDbMock(() => s))
 *   beforeEach(() => { s = createDbState() })
 */
// oxlint-disable-next-line max-lines-per-function
export function makeDbMock(getState: () => DbState): object {
    return {
        addToTagBlocklist: (tagName: string) => {
            const s = getState();
            if (!s.tag_blocklist.some((r) => r.name === tagName)) {
                s.tag_blocklist.push({ name: tagName });
            }
            const tag = s.tags.find((t) => t.name === tagName);
            if (tag) {
                s.track_tags = s.track_tags.filter(
                    (tt) => tt.tag_id !== tag.id,
                );
                s.tags = s.tags.filter((t) => t.name !== tagName);
            }
        },

        dbRowToTrackRow: (row: TrackDbRow, tags: string[]) => ({
            album: row.album,
            artist: row.artist,
            audioId: row.audio_id,
            bitrate: row.bitrate,
            bpm: row.bpm,
            bpmQuality: row.bpm_quality,
            catalogNo: row.catalog_no,
            color: row.color,
            commentRaw: row.comment_raw,
            coverArtId: row.cover_art_id,
            duration: row.duration,
            durationFloat: row.duration_float,
            fileName: row.file_name,
            filePath: row.file_path,
            filesize: row.filesize,
            flags: row.flags,
            genre: row.genre,
            id: row.id,
            importDate: row.import_date,
            keyLyrics: row.key_lyrics,
            label: row.label,
            lastPlayed: row.last_played,
            loudnessAnalyzed: row.loudness_analyzed,
            loudnessPeak: row.loudness_peak,
            loudnessPerceived: row.loudness_perceived,
            mix: row.mix,
            musicalKey: row.musical_key,
            musicalKeyValue: row.musical_key_value,
            nmlDir: row.nml_dir,
            nmlFile: row.nml_file,
            nmlVolume: row.nml_volume,
            nmlVolumeId: row.nml_volume_id,
            playCount: row.play_count,
            producer: row.producer,
            rating: row.rating,
            releaseDate: row.release_date,
            remixer: row.remixer,
            tags,
            title: row.title,
        }),

        getDb: () =>
            Promise.resolve({
                execute: (sql: string, params?: SqlParam[]) =>
                    Promise.resolve(
                        handleExecute(getState(), sql, params ?? []),
                    ),
                select: (sql: string, params?: SqlParam[]) =>
                    Promise.resolve(
                        handleSelect(getState(), sql, params ?? []),
                    ),
            }),

        getSetting: (key: string) => {
            const s = getState();
            return s.settings.find((x) => x.key === key)?.value ?? null;
        },

        getTagBlocklist: () => {
            const s = getState();
            return new Set(s.tag_blocklist.map((r) => r.name));
        },

        getTrackBlocklist: () => {
            const s = getState();
            return new Set(s.track_blocklist.map((r) => r.artist_name));
        },

        runStartupMaintenance: async () => {},

        savePlaylist: (
            name: string,
            trackIds: number[],
            filterState?: string,
        ) => {
            const s = getState();
            const id = nextId(s.playlists);
            s.playlists.push({
                created_at: new Date().toISOString(),
                description: '',
                filter_state: filterState ?? null,
                id,
                name,
            });
            for (let i = 0; i < trackIds.length; i++) {
                s.playlist_tracks.push({
                    playlist_id: id,
                    position: i + 1,
                    track_id: trackIds[i],
                });
            }
        },

        setSetting: (key: string, value: string) => {
            const s = getState();
            const i = s.settings.findIndex((x) => x.key === key);
            if (i === -1) s.settings.push({ key, value });
            else s.settings[i].value = value;
        },
    };
}

export interface DbState {
    tracks: TrackStubRow[];
    tags: TagRow[];
    track_tags: TrackTagRow[];
    playlists: PlaylistRow[];
    playlist_tracks: PlaylistTrackRow[];
    settings: SettingRow[];
    tag_blocklist: TagBlocklistRow[];
    track_blocklist: TrackBlocklistRow[];
}

export function createDbState(): DbState {
    return {
        playlist_tracks: [],
        playlists: [],
        settings: [],
        tag_blocklist: [],
        tags: [],
        track_blocklist: [],
        track_tags: [],
        tracks: [],
    };
}
