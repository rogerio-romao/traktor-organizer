import { ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile, exists } from '@tauri-apps/plugin-fs'
import { documentDir, join } from '@tauri-apps/api/path'
import { parseNmlCollection, type ParsedTrack } from '../services/nml-parser'
import { splitCommentIntoTags } from '../services/tag-processor'
import { getDb, getSetting, setSetting, getTagBlocklist } from '../services/database'

export interface ImportStats {
  total: number
  inserted: number
  updated: number
  skipped: number
}

export function useImport() {
  const isImporting = ref(false)
  const progress = ref(0)       // 0–100
  const progressLabel = ref('')
  const error = ref<string | null>(null)

  async function resolveDefaultImportDir(): Promise<string | undefined> {
    // 1. Use last saved path if available
    const lastDir = await getSetting('last_import_dir')
    if (lastDir) return lastDir

    // 2. Try to find Traktor's default folder under Documents
    try {
      const docs = await documentDir()
      const niPath = await join(docs, 'Native Instruments')
      if (await exists(niPath)) return niPath
    } catch {
      // ignore — will fall back to undefined (OS default)
    }

    return undefined
  }

  async function pickAndImport(): Promise<ImportStats | null> {
    error.value = null

    const defaultPath = await resolveDefaultImportDir()

    const selected = await open({
      title: 'Select Traktor collection.nml',
      filters: [{ name: 'Traktor Collection', extensions: ['nml'] }],
      defaultPath,
    })

    if (!selected) return null  // User cancelled

    // Save the directory for next time
    const dir = selected.substring(0, selected.lastIndexOf('/'))
    await setSetting('last_import_dir', dir)

    return runImport(selected)
  }

  async function runImport(filePath: string): Promise<ImportStats> {
    isImporting.value = true
    progress.value = 0
    progressLabel.value = 'Reading file…'
    error.value = null

    const stats: ImportStats = { total: 0, inserted: 0, updated: 0, skipped: 0 }

    try {
      const xml = await readTextFile(filePath)

      progressLabel.value = 'Parsing collection…'
      const tracks = parseNmlCollection(xml)
      stats.total = tracks.length

      progressLabel.value = `Importing ${stats.total} tracks…`
      const tagBlocklist = await getTagBlocklist()
      await insertTracks(tracks, stats, tagBlocklist, (done) => {
        progress.value = Math.round((done / stats.total) * 100)
        progressLabel.value = `Importing track ${done} of ${stats.total}…`
      })

      progressLabel.value = `Done — ${stats.inserted} new, ${stats.updated} updated`
    } catch (e) {
      // Log the real error for debugging; show a generic message to the user.
      // TODO: add error reporting (e.g. Sentry) to capture these in production.
      console.error('[Import error]', e)
      error.value = 'Something went wrong during the import. Please try again.'
    } finally {
      isImporting.value = false
    }

    return stats
  }

  return { isImporting, progress, progressLabel, error, pickAndImport }
}

// ─── DB insertion ────────────────────────────────────────────────────────────

async function insertTracks(
  tracks: ParsedTrack[],
  stats: ImportStats,
  tagBlocklist: Set<string>,
  onProgress: (done: number) => void,
): Promise<void> {
  const db = await getDb()

  for (let i = 0; i < tracks.length; i++) {
    await upsertTrack(db, tracks[i], stats, tagBlocklist)
    onProgress(i + 1)
  }
}

async function upsertTrack(
  db: Awaited<ReturnType<typeof getDb>>,
  track: ParsedTrack,
  stats: ImportStats,
  tagBlocklist: Set<string>,
): Promise<void> {
  // Check if track already exists (match by file path)
  const existing = await db.select<{ id: number }[]>(
    'SELECT id FROM tracks WHERE file_path = $1',
    [track.filePath],
  )

  if (existing.length > 0) {
    // Existing track: update display-only fields, preserve editable fields (genre, rating, tags)
    const result = await db.execute(
      `UPDATE tracks SET
        title = $1, artist = $2, album = $3,
        bpm = $4, musical_key = $5, musical_key_value = $6,
        duration = $7, duration_float = $8,
        label = $9, remixer = $10, producer = $11, release_date = $12,
        mix = $13, catalog_no = $14, bitrate = $15, filesize = $16,
        play_count = $17, last_played = $18, color = $19,
        loudness_peak = $20, loudness_perceived = $21, loudness_analyzed = $22,
        bpm_quality = $23, key_lyrics = $24, flags = $25,
        cover_art_id = $26, comment_raw = $27, import_date = $28, audio_id = $29,
        updated_at = datetime('now')
      WHERE file_path = $30
        AND (
          title IS NOT $1 OR artist IS NOT $2 OR album IS NOT $3 OR
          bpm IS NOT $4 OR musical_key IS NOT $5 OR musical_key_value IS NOT $6 OR
          duration IS NOT $7 OR duration_float IS NOT $8 OR
          label IS NOT $9 OR remixer IS NOT $10 OR producer IS NOT $11 OR release_date IS NOT $12 OR
          mix IS NOT $13 OR catalog_no IS NOT $14 OR bitrate IS NOT $15 OR filesize IS NOT $16 OR
          play_count IS NOT $17 OR last_played IS NOT $18 OR color IS NOT $19 OR
          loudness_peak IS NOT $20 OR loudness_perceived IS NOT $21 OR loudness_analyzed IS NOT $22 OR
          bpm_quality IS NOT $23 OR key_lyrics IS NOT $24 OR flags IS NOT $25 OR
          cover_art_id IS NOT $26 OR comment_raw IS NOT $27 OR import_date IS NOT $28 OR audio_id IS NOT $29
        )`,
      [
        track.title, track.artist, track.album,
        track.bpm, track.musicalKey, track.musicalKeyValue,
        track.duration, track.durationFloat,
        track.label, track.remixer, track.producer, track.releaseDate,
        track.mix, track.catalogNo, track.bitrate, track.filesize,
        track.playCount, track.lastPlayed, track.color,
        track.loudnessPeak, track.loudnessPerceived, track.loudnessAnalyzed,
        track.bpmQuality, track.keyLyrics, track.flags,
        track.coverArtId, track.commentRaw, track.importDate, track.audioId,
        track.filePath,
      ],
    )
    // Re-sync tags from NML on update too (additive only — INSERT OR IGNORE won't
    // duplicate existing tags or remove ones added manually in the app)
    await insertTags(db, existing[0].id, track.commentRaw, tagBlocklist)
    if (result.rowsAffected > 0) {
      stats.updated++
    } else {
      stats.skipped++
    }
  } else {
    // New track: full insert including genre and rating from NML
    const result = await db.execute(
      `INSERT INTO tracks (
        title, artist, album, genre,
        bpm, musical_key, musical_key_value,
        duration, duration_float, rating,
        label, remixer, producer, release_date,
        mix, catalog_no, bitrate, filesize,
        play_count, last_played, color,
        loudness_peak, loudness_perceived, loudness_analyzed,
        bpm_quality, key_lyrics, flags,
        file_path, file_name, nml_dir, nml_file, nml_volume, nml_volume_id,
        cover_art_id, comment_raw, import_date, app_import_date, audio_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,
        $35,$36,datetime('now'),$37
      )`,
      [
        track.title, track.artist, track.album, track.genre,
        track.bpm, track.musicalKey, track.musicalKeyValue,
        track.duration, track.durationFloat, track.rating,
        track.label, track.remixer, track.producer, track.releaseDate,
        track.mix, track.catalogNo, track.bitrate, track.filesize,
        track.playCount, track.lastPlayed, track.color,
        track.loudnessPeak, track.loudnessPerceived, track.loudnessAnalyzed,
        track.bpmQuality, track.keyLyrics, track.flags,
        track.filePath, track.fileName, track.nmlDir, track.nmlFile,
        track.nmlVolume, track.nmlVolumeId,
        track.coverArtId, track.commentRaw, track.importDate, track.audioId,
      ],
    )

    const trackId = result.lastInsertId ?? 0
    if (trackId) await insertTags(db, trackId, track.commentRaw, tagBlocklist)
    stats.inserted++
  }
}

async function insertTags(
  db: Awaited<ReturnType<typeof getDb>>,
  trackId: number,
  commentRaw: string,
  tagBlocklist: Set<string>,
): Promise<void> {
  const tags = splitCommentIntoTags(commentRaw, tagBlocklist)
  for (const name of tags) {
    await db.execute('INSERT OR IGNORE INTO tags (name) VALUES ($1)', [name])
    await db.execute(
      `INSERT OR IGNORE INTO track_tags (track_id, tag_id)
       SELECT $1, id FROM tags WHERE name = $2`,
      [trackId, name],
    )
  }
}
