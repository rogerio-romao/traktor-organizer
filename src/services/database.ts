import Database from '@tauri-apps/plugin-sql';

import type { TrackDbRow, TrackRow } from '@/types/track';

const DB_URL = 'sqlite:traktor-organizer.db';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
    if (!db) {
        db = await Database.load(DB_URL);
    }
    return db;
}

export async function getTagBlocklist(): Promise<Set<string>> {
    const database = await getDb();
    const rows = await database.select<{ name: string }[]>('SELECT name FROM tag_blocklist');
    return new Set(rows.map((r) => r.name));
}

export async function runStartupMaintenance(): Promise<void> {
    const database = await getDb();
    const rows = await database.select<{ name: string }[]>('SELECT name FROM tag_blocklist');
    const names = rows.map((r) => r.name);
    if (names.length === 0) return;
    // tauri-plugin-sql uses positional params ($1, $2, ...), so we build one placeholder
    // per blocklist entry. e.g. 4 entries → "IN ($1,$2,$3,$4)" with names as the params array.
    const placeholders = names.map((_, i) => `$${i + 1}`).join(',');
    await database.execute(
        `DELETE FROM track_tags WHERE tag_id IN (SELECT id FROM tags WHERE name IN (${placeholders}))`,
        names,
    );
    await database.execute(`DELETE FROM tags WHERE name IN (${placeholders})`, names);
    // Remove any tags that are no longer associated with any track
    await database.execute(
        `DELETE FROM tags WHERE NOT EXISTS (SELECT 1 FROM track_tags WHERE tag_id = tags.id)`,
    );
}

export async function savePlaylist(
    name: string,
    trackIds: number[],
    filterState?: string,
): Promise<void> {
    const database = await getDb();
    const result = await database.execute(
        'INSERT INTO playlists (name, filter_state) VALUES ($1, $2)',
        [name, filterState ?? null],
    );
    const playlistId = result.lastInsertId ?? 0;
    await Promise.all(
        trackIds.map((id, i) =>
            database.execute(
                'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3)',
                [playlistId, id, i + 1],
            ),
        ),
    );
}

export function dbRowToTrackRow(row: TrackDbRow, tags: string[]): TrackRow {
    return {
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
    };
}

export async function addToTagBlocklist(tagName: string): Promise<void> {
    const database = await getDb();
    await database.execute('INSERT OR IGNORE INTO tag_blocklist (name) VALUES ($1)', [tagName]);
    await database.execute(
        'DELETE FROM track_tags WHERE tag_id = (SELECT id FROM tags WHERE name = $1)',
        [tagName],
    );
    await database.execute('DELETE FROM tags WHERE name = $1', [tagName]);
}

export async function getSetting(key: string): Promise<string | null> {
    const database = await getDb();
    const rows = await database.select<{ value: string }[]>(
        'SELECT value FROM settings WHERE key = $1',
        [key],
    );
    return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
    const database = await getDb();
    await database.execute(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
        [key, value],
    );
}
