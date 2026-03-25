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

export interface DbState {
  tracks: any[]
  tags: any[]
  track_tags: any[]
  playlists: any[]
  playlist_tracks: any[]
  settings: any[]
  tag_blocklist: any[]
  track_blocklist: any[]
}

export function createDbState(): DbState {
  return {
    tracks: [],
    tags: [],
    track_tags: [],
    playlists: [],
    playlist_tracks: [],
    settings: [],
    tag_blocklist: [],
    track_blocklist: [],
  }
}

export function resetDbState(s: DbState): void {
  s.tracks = []
  s.tags = []
  s.track_tags = []
  s.playlists = []
  s.playlist_tracks = []
  s.settings = []
  s.tag_blocklist = []
  s.track_blocklist = []
}

function nextId(rows: any[]): number {
  return rows.length === 0 ? 1 : Math.max(...rows.map((r) => r.id ?? 0)) + 1
}

// ── SQL execute handler ────────────────────────────────────────────────────

export function handleExecute(
  s: DbState,
  sql: string,
  params: any[],
): { rowsAffected: number; lastInsertId?: number } {
  const sl = sql.replace(/\s+/g, ' ').trim().toLowerCase()
  const p = params ?? []

  // Big UPDATE from upsertTrack (file_path = $30)
  if (sl.startsWith('update tracks set') && sl.includes('where file_path = $30')) {
    // params: p[0]=title…p[2]=album, p[3]=bpm…p[5]=musicalKeyValue,
    //         p[6]=duration, p[7]=durationFloat, p[8]=label…p[11]=releaseDate,
    //         p[12]=mix…p[15]=filesize, p[16]=playCount…p[18]=color,
    //         p[19..21]=loudness, p[22..24]=bpmQuality/keyLyrics/flags,
    //         p[25]=coverArtId, p[26]=commentRaw, p[27]=importDate, p[28]=audioId,
    //         p[29]=filePath
    const track = s.tracks.find((t) => t.file_path === p[29])
    if (!track) return { rowsAffected: 0 }
    const updates: Record<string, any> = {
      title: p[0], artist: p[1], album: p[2],
      bpm: p[3], musical_key: p[4], musical_key_value: p[5],
      duration: p[6], duration_float: p[7],
      label: p[8], remixer: p[9], producer: p[10], release_date: p[11],
      mix: p[12], catalog_no: p[13], bitrate: p[14], filesize: p[15],
      play_count: p[16], last_played: p[17], color: p[18],
      loudness_peak: p[19], loudness_perceived: p[20], loudness_analyzed: p[21],
      bpm_quality: p[22], key_lyrics: p[23], flags: p[24],
      cover_art_id: p[25], comment_raw: p[26], import_date: p[27], audio_id: p[28],
    }
    const changed = Object.entries(updates).some(([k, v]) => track[k] !== v)
    if (!changed) return { rowsAffected: 0 }
    Object.assign(track, updates)
    return { rowsAffected: 1 }
  }

  // Simple single-field UPDATE for inline edits — WHERE id = $2
  if (sl.startsWith('update tracks set title') && sl.includes('where id = $2')) {
    const t = s.tracks.find((r) => r.id === p[1])
    if (t) { t.title = p[0]; return { rowsAffected: 1 } }
    return { rowsAffected: 0 }
  }
  if (sl.startsWith('update tracks set artist') && sl.includes('where id = $2')) {
    const t = s.tracks.find((r) => r.id === p[1])
    if (t) { t.artist = p[0]; return { rowsAffected: 1 } }
    return { rowsAffected: 0 }
  }
  if (sl.startsWith('update tracks set genre') && sl.includes('where id = $2')) {
    const t = s.tracks.find((r) => r.id === p[1])
    if (t) { t.genre = p[0]; return { rowsAffected: 1 } }
    return { rowsAffected: 0 }
  }
  if (sl.startsWith('update tracks set rating') && sl.includes('where id = $2')) {
    const t = s.tracks.find((r) => r.id === p[1])
    if (t) { t.rating = p[0]; return { rowsAffected: 1 } }
    return { rowsAffected: 0 }
  }

  // INSERT INTO tracks (big insert from upsertTrack)
  if (sl.startsWith('insert into tracks')) {
    const id = nextId(s.tracks)
    s.tracks.push({
      id,
      title: p[0], artist: p[1], album: p[2], genre: p[3],
      bpm: p[4], musical_key: p[5], musical_key_value: p[6],
      duration: p[7], duration_float: p[8], rating: p[9],
      label: p[10], remixer: p[11], producer: p[12], release_date: p[13],
      mix: p[14], catalog_no: p[15], bitrate: p[16], filesize: p[17],
      play_count: p[18], last_played: p[19], color: p[20],
      loudness_peak: p[21], loudness_perceived: p[22], loudness_analyzed: p[23],
      bpm_quality: p[24], key_lyrics: p[25], flags: p[26],
      file_path: p[27], file_name: p[28], nml_dir: p[29], nml_file: p[30],
      nml_volume: p[31], nml_volume_id: p[32],
      cover_art_id: p[33], comment_raw: p[34], import_date: p[35],
      app_import_date: new Date().toISOString(), audio_id: p[36],
    })
    return { rowsAffected: 1, lastInsertId: id }
  }

  // INSERT OR IGNORE INTO tags (name) VALUES ($1)
  if (sl.startsWith('insert or ignore into tags')) {
    const name = p[0]
    if (!s.tags.find((t) => t.name === name)) {
      const id = nextId(s.tags)
      s.tags.push({ id, name })
      return { rowsAffected: 1, lastInsertId: id }
    }
    return { rowsAffected: 0 }
  }

  // INSERT OR IGNORE INTO track_tags (track_id, tag_id) VALUES ($1, $2)
  if (sl.startsWith('insert or ignore into track_tags') && sl.includes('values')) {
    const [trackId, tagId] = [p[0], p[1]]
    const exists = s.track_tags.find((tt) => tt.track_id === trackId && tt.tag_id === tagId)
    if (!exists) {
      s.track_tags.push({ track_id: trackId, tag_id: tagId })
      return { rowsAffected: 1 }
    }
    return { rowsAffected: 0 }
  }

  // INSERT OR IGNORE INTO track_tags (...) SELECT $1, id FROM tags WHERE name = $2
  if (sl.startsWith('insert or ignore into track_tags') && sl.includes('select')) {
    const [trackId, tagName] = [p[0], p[1]]
    const tag = s.tags.find((t) => t.name === tagName)
    if (!tag) return { rowsAffected: 0 }
    const exists = s.track_tags.find((tt) => tt.track_id === trackId && tt.tag_id === tag.id)
    if (!exists) {
      s.track_tags.push({ track_id: trackId, tag_id: tag.id })
      return { rowsAffected: 1 }
    }
    return { rowsAffected: 0 }
  }

  // DELETE FROM track_tags WHERE track_id = $1 AND tag_id = (SELECT id FROM tags WHERE name = $2)
  if (sl.startsWith('delete from track_tags') && sl.includes('where track_id = $1')) {
    const tag = s.tags.find((t) => t.name === p[1])
    if (!tag) return { rowsAffected: 0 }
    const before = s.track_tags.length
    s.track_tags = s.track_tags.filter(
      (tt) => !(tt.track_id === p[0] && tt.tag_id === tag.id),
    )
    return { rowsAffected: before - s.track_tags.length }
  }

  // DELETE FROM tags WHERE name = $1 AND NOT EXISTS (...) — orphan cleanup
  if (sl.startsWith('delete from tags where name = $1') && sl.includes('not exists')) {
    const tag = s.tags.find((t) => t.name === p[0])
    if (!tag) return { rowsAffected: 0 }
    const hasLinks = s.track_tags.some((tt) => tt.tag_id === tag.id)
    if (!hasLinks) {
      s.tags = s.tags.filter((t) => t.name !== p[0])
      return { rowsAffected: 1 }
    }
    return { rowsAffected: 0 }
  }

  // DELETE FROM playlist_tracks WHERE playlist_id = $1
  if (sl.startsWith('delete from playlist_tracks')) {
    const before = s.playlist_tracks.length
    s.playlist_tracks = s.playlist_tracks.filter((pt) => pt.playlist_id !== p[0])
    return { rowsAffected: before - s.playlist_tracks.length }
  }

  // INSERT INTO playlist_tracks (playlist_id, track_id, position)
  if (sl.startsWith('insert into playlist_tracks') || (sl.includes('into playlist_tracks') && sl.includes('values'))) {
    const [pid, tid, pos] = [p[0], p[1], p[2]]
    const exists = s.playlist_tracks.find(
      (pt) => pt.playlist_id === pid && pt.track_id === tid,
    )
    if (!exists) {
      s.playlist_tracks.push({ playlist_id: pid, track_id: tid, position: pos })
      return { rowsAffected: 1 }
    }
    return { rowsAffected: 0 }
  }

  return { rowsAffected: 0 }
}

// ── SQL select handler ─────────────────────────────────────────────────────

export function handleSelect(s: DbState, sql: string, params: any[]): any[] {
  const sl = sql.replace(/\s+/g, ' ').trim().toLowerCase()
  const p = params ?? []

  // loadAllTracks: SELECT * FROM tracks WHERE artist NOT IN (SELECT artist_name FROM track_blocklist)
  if (sl.includes('from tracks') && sl.includes('artist not in')) {
    const blocklist = new Set(s.track_blocklist.map((r) => r.artist_name))
    return [...s.tracks]
      .filter((t) => !blocklist.has(t.artist))
      .sort((a, b) => {
        const cmp = (a.artist ?? '').localeCompare(b.artist ?? '')
        return cmp !== 0 ? cmp : (a.title ?? '').localeCompare(b.title ?? '')
      })
  }

  // loadAllTracks tag join: SELECT tt.track_id, t.name FROM track_tags tt JOIN tags t (no WHERE)
  if (
    sl.includes('tt.track_id') &&
    sl.includes('track_tags tt') &&
    !sl.includes('where tt.track_id in')
  ) {
    return s.track_tags.map((tt) => {
      const tag = s.tags.find((t) => t.id === tt.tag_id)
      return { track_id: tt.track_id, name: tag?.name ?? '' }
    })
  }

  // SELECT id FROM tracks WHERE file_path = $1
  if (sl.startsWith('select id from tracks where file_path')) {
    return s.tracks.filter((t) => t.file_path === p[0]).map((t) => ({ id: t.id }))
  }

  // SELECT id FROM tags WHERE name = $1
  if (sl.startsWith('select id from tags where name')) {
    return s.tags.filter((t) => t.name === p[0]).map((t) => ({ id: t.id }))
  }

  // loadPlaylists: SELECT p.id, p.name, ... FROM playlists p LEFT JOIN playlist_tracks
  if (sl.includes('from playlists p') && sl.includes('left join playlist_tracks')) {
    return [...s.playlists]
      .map((pl) => ({
        id: pl.id,
        name: pl.name,
        description: pl.description ?? '',
        created_at: pl.created_at ?? new Date().toISOString(),
        filter_state: pl.filter_state ?? null,
        track_count: s.playlist_tracks.filter((pt) => pt.playlist_id === pl.id).length,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  // loadPlaylistTracks tracks: SELECT t.* FROM tracks t JOIN playlist_tracks pt WHERE pt.playlist_id = $1
  if (sl.includes('from tracks t') && sl.includes('join playlist_tracks pt')) {
    const pts = s.playlist_tracks
      .filter((pt) => pt.playlist_id === p[0])
      .sort((a, b) => a.position - b.position)
    return pts.map((pt) => s.tracks.find((t) => t.id === pt.track_id)).filter(Boolean)
  }

  // loadPlaylistTracks tags: SELECT tt.track_id, tg.name ... WHERE tt.track_id IN (SELECT ...)
  if (sl.includes('track_tags tt') && sl.includes('where tt.track_id in')) {
    const trackIds = new Set(
      s.playlist_tracks.filter((pt) => pt.playlist_id === p[0]).map((pt) => pt.track_id),
    )
    return s.track_tags
      .filter((tt) => trackIds.has(tt.track_id))
      .map((tt) => {
        const tag = s.tags.find((t) => t.id === tt.tag_id)
        return { track_id: tt.track_id, name: tag?.name ?? '' }
      })
  }

  return []
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
export function makeDbMock(getState: () => DbState) {
  return {
    getDb: () =>
      Promise.resolve({
        execute: (sql: string, params?: any[]) =>
          Promise.resolve(handleExecute(getState(), sql, params ?? [])),
        select: (sql: string, params?: any[]) =>
          Promise.resolve(handleSelect(getState(), sql, params ?? [])),
      }),

    getSetting: async (key: string) => {
      const s = getState()
      return s.settings.find((x: any) => x.key === key)?.value ?? null
    },

    setSetting: async (key: string, value: string) => {
      const s = getState()
      const i = s.settings.findIndex((x: any) => x.key === key)
      if (i >= 0) s.settings[i].value = value
      else s.settings.push({ key, value })
    },

    getTagBlocklist: async () => {
      const s = getState()
      return new Set(s.tag_blocklist.map((r: any) => r.name))
    },

    getTrackBlocklist: async () => {
      const s = getState()
      return new Set(s.track_blocklist.map((r: any) => r.artist_name))
    },

    addToTagBlocklist: async (tagName: string) => {
      const s = getState()
      if (!s.tag_blocklist.find((r: any) => r.name === tagName)) {
        s.tag_blocklist.push({ name: tagName })
      }
      const tag = s.tags.find((t: any) => t.name === tagName)
      if (tag) {
        s.track_tags = s.track_tags.filter((tt: any) => tt.tag_id !== tag.id)
        s.tags = s.tags.filter((t: any) => t.name !== tagName)
      }
    },

    savePlaylist: async (name: string, trackIds: number[], filterState?: string) => {
      const s = getState()
      const id = nextId(s.playlists)
      s.playlists.push({
        id,
        name,
        description: '',
        created_at: new Date().toISOString(),
        filter_state: filterState ?? null,
      })
      for (let i = 0; i < trackIds.length; i++) {
        s.playlist_tracks.push({ playlist_id: id, track_id: trackIds[i], position: i + 1 })
      }
    },

    runStartupMaintenance: async () => {},
  }
}
