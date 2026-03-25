import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createDbState, makeDbMock, type DbState } from './helpers/db-stub'
import { useTracksStore } from '../../stores/tracks'
import type { TrackRow } from '../../types/track'

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState

vi.mock('../../services/database', () => makeDbMock(() => s))

function makeTrack(overrides: Partial<TrackRow> & Pick<TrackRow, 'id' | 'title' | 'artist'>): TrackRow {
  return {
    album: '', genre: 'Techno', bpm: 130, musicalKey: '4d', musicalKeyValue: 10,
    duration: 300, durationFloat: 300, rating: 3, label: '', remixer: '', producer: '',
    releaseDate: '', tags: [], filePath: `/music/${overrides.id}.mp3`,
    fileName: `${overrides.id}.mp3`, nmlDir: '/music/', nmlFile: `${overrides.id}.mp3`,
    nmlVolume: 'osx', nmlVolumeId: 'osx', mix: '', catalogNo: '', bitrate: null,
    filesize: null, playCount: 0, lastPlayed: '', color: null, loudnessPeak: null,
    loudnessPerceived: null, loudnessAnalyzed: null, bpmQuality: null, keyLyrics: '',
    flags: null, coverArtId: '', commentRaw: '', importDate: '', audioId: '',
    ...overrides,
  }
}

let store: ReturnType<typeof useTracksStore>

beforeEach(() => {
  s = createDbState()
  setActivePinia(createPinia())
  store = useTracksStore()
})

// ── Tag filters ───────────────────────────────────────────────────────────────

describe('tag filters', () => {
  it('adding a tag filter returns only tracks that have that tag', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', tags: ['techno', 'dark'] }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', tags: ['house'] }),
      makeTrack({ id: 3, title: 'C', artist: 'Z', tags: ['techno'] }),
    ]

    store.activeTagFilters = ['techno']

    expect(store.filteredTracks).toHaveLength(2)
    expect(store.filteredTracks.map((t) => t.id)).toEqual(expect.arrayContaining([1, 3]))
  })

  it('uses AND semantics — track must have ALL active tag filters', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', tags: ['techno', 'dark'] }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', tags: ['techno'] }),
    ]

    store.activeTagFilters = ['techno', 'dark']

    expect(store.filteredTracks).toHaveLength(1)
    expect(store.filteredTracks[0].id).toBe(1)
  })

  it('removing a tag filter updates filteredTracks reactively', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', tags: ['techno'] }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', tags: ['house'] }),
    ]
    store.activeTagFilters = ['techno']
    expect(store.filteredTracks).toHaveLength(1)

    store.activeTagFilters = []
    expect(store.filteredTracks).toHaveLength(2)
  })
})

// ── Search filter ─────────────────────────────────────────────────────────────

describe('globalSearch', () => {
  it('matches title case-insensitively', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'Blue Monday', artist: 'New Order' }),
      makeTrack({ id: 2, title: 'Red Alert', artist: 'Basement Jaxx' }),
    ]

    store.globalSearch = 'blue'

    expect(store.filteredTracks).toHaveLength(1)
    expect(store.filteredTracks[0].id).toBe(1)
  })

  it('matches artist', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'Track A', artist: 'Aphex Twin' }),
      makeTrack({ id: 2, title: 'Track B', artist: 'Orbital' }),
    ]

    store.globalSearch = 'aphex'

    expect(store.filteredTracks).toHaveLength(1)
    expect(store.filteredTracks[0].id).toBe(1)
  })

  it('matches genre', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', genre: 'Techno' }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', genre: 'House' }),
    ]

    store.globalSearch = 'house'

    expect(store.filteredTracks).toHaveLength(1)
    expect(store.filteredTracks[0].id).toBe(2)
  })

  it('matches tag text', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', tags: ['peak-time'] }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', tags: ['warm-up'] }),
    ]

    store.globalSearch = 'peak'

    expect(store.filteredTracks).toHaveLength(1)
    expect(store.filteredTracks[0].id).toBe(1)
  })

  it('whitespace-only search returns full list', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X' }),
      makeTrack({ id: 2, title: 'B', artist: 'Y' }),
    ]

    store.globalSearch = '   '

    expect(store.filteredTracks).toHaveLength(2)
  })
})

// ── Genre / key / rating filters ─────────────────────────────────────────────

describe('genre, key, and rating filters', () => {
  it('genreFilter does a case-insensitive exact match', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', genre: 'Techno' }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', genre: 'House' }),
      makeTrack({ id: 3, title: 'C', artist: 'Z', genre: 'techno' }),
    ]

    store.genreFilter = 'techno'

    expect(store.filteredTracks).toHaveLength(2)
    expect(store.filteredTracks.map((t) => t.id)).toEqual(expect.arrayContaining([1, 3]))
  })

  it('keyFilter does an exact match', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', musicalKey: '4d' }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', musicalKey: '5m' }),
    ]

    store.keyFilter = '4d'

    expect(store.filteredTracks).toHaveLength(1)
    expect(store.filteredTracks[0].id).toBe(1)
  })

  it('ratingFilter returns tracks with at least the given star count', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X', rating: 5 }),
      makeTrack({ id: 2, title: 'B', artist: 'Y', rating: 3 }),
      makeTrack({ id: 3, title: 'C', artist: 'Z', rating: 1 }),
    ]

    store.ratingFilter = 3

    expect(store.filteredTracks).toHaveLength(2)
    expect(store.filteredTracks.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2]))
  })
})

// ── Composition and reset ─────────────────────────────────────────────────────

describe('filter composition and clearFilters', () => {
  it('composing search + genre + rating filters narrows results correctly', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'Midnight', artist: 'Dj A', genre: 'Techno', rating: 5 }),
      makeTrack({ id: 2, title: 'Sunrise', artist: 'Dj A', genre: 'Techno', rating: 2 }),
      makeTrack({ id: 3, title: 'Midnight Blues', artist: 'Dj B', genre: 'House', rating: 5 }),
    ]

    store.globalSearch = 'midnight'
    store.genreFilter = 'Techno'
    store.ratingFilter = 4

    expect(store.filteredTracks).toHaveLength(1)
    expect(store.filteredTracks[0].id).toBe(1)
  })

  it('clearFilters resets all filters and returns the full collection', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X' }),
      makeTrack({ id: 2, title: 'B', artist: 'Y' }),
    ]

    store.globalSearch = 'A'
    store.activeTagFilters = ['techno']
    store.genreFilter = 'House'
    store.ratingFilter = 4

    store.clearFilters()

    expect(store.globalSearch).toBe('')
    expect(store.activeTagFilters).toEqual([])
    expect(store.genreFilter).toBeNull()
    expect(store.ratingFilter).toBeNull()
    expect(store.filteredTracks).toHaveLength(2)
  })

  it('empty filters return the full input array unchanged', () => {
    store.allTracks = [
      makeTrack({ id: 1, title: 'A', artist: 'X' }),
      makeTrack({ id: 2, title: 'B', artist: 'Y' }),
    ]

    expect(store.filteredTracks).toHaveLength(2)
  })
})

// ── loadAllTracks reads from DB and builds the track-tag map ─────────────────

describe('loadAllTracks', () => {
  it('loads tracks from the DB and attaches tags via the tag map', async () => {
    s.tracks.push({
      id: 1, title: 'DB Track', artist: 'DB Artist', album: '', genre: 'Techno',
      bpm: 130, musical_key: '4d', musical_key_value: 10,
      duration: 300, duration_float: 300, rating: 4,
      label: '', remixer: '', producer: '', release_date: '',
      file_path: '/music/db.mp3', file_name: 'db.mp3', nml_dir: '/music/', nml_file: 'db.mp3',
      nml_volume: 'osx', nml_volume_id: 'osx', mix: '', catalog_no: '', bitrate: null,
      filesize: null, play_count: 0, last_played: '', color: null,
      loudness_peak: null, loudness_perceived: null, loudness_analyzed: null,
      bpm_quality: null, key_lyrics: '', flags: null, cover_art_id: '',
      comment_raw: '', import_date: '', audio_id: '',
    })
    s.tags.push({ id: 1, name: 'techno' })
    s.track_tags.push({ track_id: 1, tag_id: 1 })

    await store.loadAllTracks()

    expect(store.allTracks).toHaveLength(1)
    expect(store.allTracks[0].title).toBe('DB Track')
    expect(store.allTracks[0].tags).toEqual(['techno'])
  })

  it('excludes tracks whose artist is in the blocklist', async () => {
    s.tracks.push(
      { id: 1, title: 'Good Track', artist: 'Good Artist', file_path: '/a.mp3', genre: 'Techno', bpm: 130, musical_key: '', musical_key_value: null, duration: 300, duration_float: 300, rating: 0, album: '', label: '', remixer: '', producer: '', release_date: '', file_name: 'a.mp3', nml_dir: '/', nml_file: 'a.mp3', nml_volume: 'osx', nml_volume_id: 'osx', mix: '', catalog_no: '', bitrate: null, filesize: null, play_count: 0, last_played: '', color: null, loudness_peak: null, loudness_perceived: null, loudness_analyzed: null, bpm_quality: null, key_lyrics: '', flags: null, cover_art_id: '', comment_raw: '', import_date: '', audio_id: '' },
      { id: 2, title: 'Blocked Track', artist: 'Blocked Artist', file_path: '/b.mp3', genre: 'Techno', bpm: 130, musical_key: '', musical_key_value: null, duration: 300, duration_float: 300, rating: 0, album: '', label: '', remixer: '', producer: '', release_date: '', file_name: 'b.mp3', nml_dir: '/', nml_file: 'b.mp3', nml_volume: 'osx', nml_volume_id: 'osx', mix: '', catalog_no: '', bitrate: null, filesize: null, play_count: 0, last_played: '', color: null, loudness_peak: null, loudness_perceived: null, loudness_analyzed: null, bpm_quality: null, key_lyrics: '', flags: null, cover_art_id: '', comment_raw: '', import_date: '', audio_id: '' },
    )
    s.track_blocklist.push({ artist_name: 'Blocked Artist' })

    await store.loadAllTracks()

    expect(store.allTracks).toHaveLength(1)
    expect(store.allTracks[0].artist).toBe('Good Artist')
  })
})
