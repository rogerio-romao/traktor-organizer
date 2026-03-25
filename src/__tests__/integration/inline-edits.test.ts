import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createDbState, makeDbMock, type DbState } from './helpers/db-stub'
import { useTracksStore } from '../../stores/tracks'
import type { TrackRow } from '../../types/track'

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState

vi.mock('../../services/database', () => makeDbMock(() => s))

function makeDbTrack(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    title: `Track ${id}`, artist: 'Artist A', album: 'Album', genre: 'House',
    bpm: 128, musical_key: '1m', musical_key_value: 0,
    duration: 300, duration_float: 300, rating: 3,
    label: '', remixer: '', producer: '', release_date: '',
    file_path: `/music/track${id}.mp3`, file_name: `track${id}.mp3`,
    nml_dir: '/music/', nml_file: `track${id}.mp3`, nml_volume: 'osx', nml_volume_id: 'osx',
    mix: '', catalog_no: '', bitrate: null, filesize: null,
    play_count: 0, last_played: '', color: null,
    loudness_peak: null, loudness_perceived: null, loudness_analyzed: null,
    bpm_quality: null, key_lyrics: '', flags: null,
    cover_art_id: '', comment_raw: '', import_date: '', audio_id: '',
    ...overrides,
  }
}

function makeStoreTrack(id: number, overrides: Partial<TrackRow> = {}): TrackRow {
  return {
    id,
    title: `Track ${id}`, artist: 'Artist A', album: 'Album', genre: 'House',
    bpm: 128, musicalKey: '1m', musicalKeyValue: 0,
    duration: 300, durationFloat: 300, rating: 3,
    label: '', remixer: '', producer: '', releaseDate: '', tags: [],
    filePath: `/music/track${id}.mp3`, fileName: `track${id}.mp3`,
    nmlDir: '/music/', nmlFile: `track${id}.mp3`, nmlVolume: 'osx', nmlVolumeId: 'osx',
    mix: '', catalogNo: '', bitrate: null, filesize: null,
    playCount: 0, lastPlayed: '', color: null,
    loudnessPeak: null, loudnessPerceived: null, loudnessAnalyzed: null,
    bpmQuality: null, keyLyrics: '', flags: null,
    coverArtId: '', commentRaw: '', importDate: '', audioId: '',
    ...overrides,
  }
}

let store: ReturnType<typeof useTracksStore>

beforeEach(() => {
  s = createDbState()
  setActivePinia(createPinia())
  store = useTracksStore()
})

// ── updateTitle ───────────────────────────────────────────────────────────────

describe('updateTitle', () => {
  it('persists the new title to the DB row', async () => {
    s.tracks.push(makeDbTrack(1))
    store.allTracks = [makeStoreTrack(1)]

    await store.updateTitle(1, 'New Title')

    expect(s.tracks[0].title).toBe('New Title')
  })

  it('mutates the in-memory TrackRow immediately', async () => {
    s.tracks.push(makeDbTrack(1))
    const track = makeStoreTrack(1)
    store.allTracks = [track]

    await store.updateTitle(1, 'New Title')

    expect(track.title).toBe('New Title')
  })
})

// ── updateArtist ──────────────────────────────────────────────────────────────

describe('updateArtist', () => {
  it('persists the new artist to the DB row', async () => {
    s.tracks.push(makeDbTrack(1))
    store.allTracks = [makeStoreTrack(1)]

    await store.updateArtist(1, 'New Artist')

    expect(s.tracks[0].artist).toBe('New Artist')
  })

  it('mutates the in-memory TrackRow immediately', async () => {
    s.tracks.push(makeDbTrack(1))
    const track = makeStoreTrack(1)
    store.allTracks = [track]

    await store.updateArtist(1, 'New Artist')

    expect(track.artist).toBe('New Artist')
  })
})

// ── updateGenre ───────────────────────────────────────────────────────────────

describe('updateGenre', () => {
  it('persists the new genre to the DB row', async () => {
    s.tracks.push(makeDbTrack(1))
    store.allTracks = [makeStoreTrack(1)]

    await store.updateGenre(1, 'Techno')

    expect(s.tracks[0].genre).toBe('Techno')
  })

  it('mutates the in-memory TrackRow immediately', async () => {
    s.tracks.push(makeDbTrack(1))
    const track = makeStoreTrack(1)
    store.allTracks = [track]

    await store.updateGenre(1, 'Techno')

    expect(track.genre).toBe('Techno')
  })

  it('genre change is immediately reflected in filteredTracks', async () => {
    s.tracks.push(makeDbTrack(1))
    const track = makeStoreTrack(1, { genre: 'House' })
    store.allTracks = [track]
    store.genreFilter = 'Techno'
    expect(store.filteredTracks).toHaveLength(0)

    await store.updateGenre(1, 'Techno')

    expect(store.filteredTracks).toHaveLength(1)
  })
})

// ── updateRating ──────────────────────────────────────────────────────────────

describe('updateRating', () => {
  it('persists the rating value to the DB row', async () => {
    s.tracks.push(makeDbTrack(1))
    store.allTracks = [makeStoreTrack(1)]

    await store.updateRating(1, 5)

    expect(s.tracks[0].rating).toBe(5)
  })

  it('mutates the in-memory TrackRow immediately', async () => {
    s.tracks.push(makeDbTrack(1))
    const track = makeStoreTrack(1)
    store.allTracks = [track]

    await store.updateRating(1, 5)

    expect(track.rating).toBe(5)
  })

  it('rating reads back correctly through ratingFilter', async () => {
    s.tracks.push(makeDbTrack(1))
    const track = makeStoreTrack(1, { rating: 1 })
    store.allTracks = [track]
    store.ratingFilter = 4
    expect(store.filteredTracks).toHaveLength(0)

    await store.updateRating(1, 5)

    expect(store.filteredTracks).toHaveLength(1)
  })
})
