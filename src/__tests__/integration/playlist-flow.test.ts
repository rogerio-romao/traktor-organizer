import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createDbState, makeDbMock, type DbState } from './helpers/db-stub'
import { usePlaylistView } from '../../composables/usePlaylistView'
import { usePlaylistsStore } from '../../stores/playlists'
import { useTracksStore } from '../../stores/tracks'
import { savePlaylist } from '../../services/database'
import type { TrackRow } from '../../types/track'

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState

vi.mock('../../services/database', () => makeDbMock(() => s))

function makeDbTrack(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    title: `Track ${id}`, artist: `Artist ${id}`, album: '', genre: 'Techno',
    bpm: 130, musical_key: '4d', musical_key_value: 10,
    duration: 300, duration_float: 300, rating: 4,
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
    title: `Track ${id}`, artist: `Artist ${id}`, album: '', genre: 'Techno',
    bpm: 130, musicalKey: '4d', musicalKeyValue: 10,
    duration: 300, durationFloat: 300, rating: 4, label: '', remixer: '',
    producer: '', releaseDate: '', tags: [],
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

beforeEach(() => {
  s = createDbState()
  setActivePinia(createPinia())
  // Reset the module-level singleton state
  usePlaylistView().closePlaylist()
})

// ── savePlaylist ──────────────────────────────────────────────────────────────

describe('savePlaylist', () => {
  it('creates a playlist row and links tracks', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2))

    await savePlaylist('My Playlist', [1, 2])

    expect(s.playlists).toHaveLength(1)
    expect(s.playlists[0].name).toBe('My Playlist')
    expect(s.playlist_tracks.map((pt: any) => pt.track_id)).toEqual([1, 2])
  })

  it('stores filter_state JSON when provided', async () => {
    const filterState = JSON.stringify({ globalSearch: 'test', activeTagFilters: ['techno'] })

    await savePlaylist('Filtered', [], filterState)

    expect(s.playlists[0].filter_state).toBe(filterState)
  })
})

// ── openPlaylist ──────────────────────────────────────────────────────────────

describe('openPlaylist — loading tracks', () => {
  it('loads the playlist tracks and exposes them via playlistTracks', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2))
    s.playlists.push({ id: 10, name: 'Evening Set', description: '', created_at: new Date().toISOString(), filter_state: null })
    s.playlist_tracks.push(
      { playlist_id: 10, track_id: 1, position: 0 },
      { playlist_id: 10, track_id: 2, position: 1 },
    )

    const view = usePlaylistView()
    await view.openPlaylist({ id: 10, name: 'Evening Set', description: '', createdAt: new Date().toISOString(), trackCount: 2, filterState: null })

    expect(view.playlistTracks.value).toHaveLength(2)
    expect(view.playlistTracks.value.map((t) => t.id)).toEqual([1, 2])
  })

  it('respects saved track order (position column)', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3))
    s.playlists.push({ id: 10, name: 'Set', description: '', created_at: new Date().toISOString(), filter_state: null })
    s.playlist_tracks.push(
      { playlist_id: 10, track_id: 3, position: 0 },
      { playlist_id: 10, track_id: 1, position: 1 },
      { playlist_id: 10, track_id: 2, position: 2 },
    )

    const view = usePlaylistView()
    await view.openPlaylist({ id: 10, name: 'Set', description: '', createdAt: new Date().toISOString(), trackCount: 3, filterState: null })

    expect(view.playlistTracks.value.map((t) => t.id)).toEqual([3, 1, 2])
  })
})

// ── Drift detection ───────────────────────────────────────────────────────────

describe('drift detection', () => {
  it('sets suggestedTracks when filter re-run yields different tracks', async () => {
    // Saved playlist has tracks 1 and 2
    s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3))
    s.playlists.push({
      id: 10, name: 'Dynamic Set', description: '', created_at: new Date().toISOString(),
      filter_state: JSON.stringify({ globalSearch: '', activeTagFilters: [], genreFilter: 'Techno', keyFilter: null, ratingFilter: null }),
    })
    s.playlist_tracks.push(
      { playlist_id: 10, track_id: 1, position: 0 },
      { playlist_id: 10, track_id: 2, position: 1 },
    )

    // Populate the live tracks store (includes track 3 which was not in the saved playlist)
    const tracksStore = useTracksStore()
    tracksStore.allTracks = [
      makeStoreTrack(1, { genre: 'Techno' }),
      makeStoreTrack(2, { genre: 'Techno' }),
      makeStoreTrack(3, { genre: 'Techno' }),  // new track that matches the filter
    ]

    const view = usePlaylistView()
    const playlist = {
      id: 10, name: 'Dynamic Set', description: '', createdAt: new Date().toISOString(),
      trackCount: 2,
      filterState: { globalSearch: '', activeTagFilters: [], genreFilter: 'Techno', keyFilter: null, ratingFilter: null },
    }
    await view.openPlaylist(playlist)

    // Filter re-run returns 3 tracks but saved has 2 → drift
    expect(view.suggestedTracks.value).not.toBeNull()
    expect(view.suggestedTracks.value).toHaveLength(3)
  })

  it('does NOT set suggestedTracks when filter re-run matches saved tracks', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2))
    s.playlists.push({
      id: 11, name: 'Stable Set', description: '', created_at: new Date().toISOString(),
      filter_state: JSON.stringify({ globalSearch: '', activeTagFilters: [], genreFilter: 'Techno', keyFilter: null, ratingFilter: null }),
    })
    s.playlist_tracks.push(
      { playlist_id: 11, track_id: 1, position: 0 },
      { playlist_id: 11, track_id: 2, position: 1 },
    )

    const tracksStore = useTracksStore()
    tracksStore.allTracks = [
      makeStoreTrack(1, { genre: 'Techno' }),
      makeStoreTrack(2, { genre: 'Techno' }),
    ]

    const view = usePlaylistView()
    await view.openPlaylist({
      id: 11, name: 'Stable Set', description: '', createdAt: new Date().toISOString(),
      trackCount: 2,
      filterState: { globalSearch: '', activeTagFilters: [], genreFilter: 'Techno', keyFilter: null, ratingFilter: null },
    })

    expect(view.suggestedTracks.value).toBeNull()
  })
})

// ── applySuggestedUpdate ──────────────────────────────────────────────────────

describe('applySuggestedUpdate', () => {
  it('replaces playlistTracks with the suggested tracks', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3))
    s.playlists.push({
      id: 10, name: 'Set', description: '', created_at: new Date().toISOString(),
      filter_state: JSON.stringify({ globalSearch: '', activeTagFilters: [], genreFilter: 'Techno', keyFilter: null, ratingFilter: null }),
    })
    s.playlist_tracks.push({ playlist_id: 10, track_id: 1, position: 0 })

    const tracksStore = useTracksStore()
    tracksStore.allTracks = [
      makeStoreTrack(1, { genre: 'Techno' }),
      makeStoreTrack(2, { genre: 'Techno' }),
      makeStoreTrack(3, { genre: 'Techno' }),
    ]

    const view = usePlaylistView()
    await view.openPlaylist({
      id: 10, name: 'Set', description: '', createdAt: new Date().toISOString(), trackCount: 1,
      filterState: { globalSearch: '', activeTagFilters: [], genreFilter: 'Techno', keyFilter: null, ratingFilter: null },
    })

    expect(view.suggestedTracks.value).toHaveLength(3)

    view.applySuggestedUpdate()

    expect(view.playlistTracks.value).toHaveLength(3)
    expect(view.suggestedTracks.value).toBeNull()
    expect(view.hasPendingUpdate.value).toBe(true)
  })
})

// ── removeTrack + updatePlaylist ──────────────────────────────────────────────

describe('removeTrack and updatePlaylist', () => {
  it('removeTrack removes the track from playlistTracks immediately', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2))
    s.playlists.push({ id: 10, name: 'Set', description: '', created_at: new Date().toISOString(), filter_state: null })
    s.playlist_tracks.push(
      { playlist_id: 10, track_id: 1, position: 0 },
      { playlist_id: 10, track_id: 2, position: 1 },
    )

    const view = usePlaylistView()
    await view.openPlaylist({ id: 10, name: 'Set', description: '', createdAt: new Date().toISOString(), trackCount: 2, filterState: null })

    view.removeTrack(1)

    expect(view.playlistTracks.value).toHaveLength(1)
    expect(view.playlistTracks.value[0].id).toBe(2)
    expect(view.hasRemovals.value).toBe(true)
  })

  it('updatePlaylist persists the new track order and clears pending state', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3))
    s.playlists.push({ id: 10, name: 'Set', description: '', created_at: new Date().toISOString(), filter_state: null })
    s.playlist_tracks.push(
      { playlist_id: 10, track_id: 1, position: 0 },
      { playlist_id: 10, track_id: 2, position: 1 },
      { playlist_id: 10, track_id: 3, position: 2 },
    )

    const view = usePlaylistView()
    await view.openPlaylist({ id: 10, name: 'Set', description: '', createdAt: new Date().toISOString(), trackCount: 3, filterState: null })

    // Remove track 2
    view.removeTrack(2)

    await view.updatePlaylist([1, 3])

    // DB should now have tracks 1 and 3 only
    const ptIds = s.playlist_tracks
      .filter((pt: any) => pt.playlist_id === 10)
      .sort((a: any, b: any) => a.position - b.position)
      .map((pt: any) => pt.track_id)
    expect(ptIds).toEqual([1, 3])

    expect(view.hasRemovals.value).toBe(false)
    expect(view.hasPendingUpdate.value).toBe(false)
  })
})

// ── loadPlaylists ─────────────────────────────────────────────────────────────

describe('usePlaylistsStore.loadPlaylists', () => {
  it('returns playlists with correct track counts', async () => {
    s.tracks.push(makeDbTrack(1), makeDbTrack(2), makeDbTrack(3))
    s.playlists.push(
      { id: 1, name: 'Set A', description: '', created_at: '2024-01-01T00:00:00.000Z', filter_state: null },
      { id: 2, name: 'Set B', description: '', created_at: '2024-01-02T00:00:00.000Z', filter_state: null },
    )
    s.playlist_tracks.push(
      { playlist_id: 1, track_id: 1, position: 0 },
      { playlist_id: 1, track_id: 2, position: 1 },
      { playlist_id: 2, track_id: 3, position: 0 },
    )

    const playlistsStore = usePlaylistsStore()
    await playlistsStore.loadPlaylists()

    expect(playlistsStore.playlists).toHaveLength(2)
    const setA = playlistsStore.playlists.find((p) => p.name === 'Set A')
    const setB = playlistsStore.playlists.find((p) => p.name === 'Set B')
    expect(setA?.trackCount).toBe(2)
    expect(setB?.trackCount).toBe(1)
  })

  it('parses filter_state JSON correctly', async () => {
    const fs = { globalSearch: 'test', activeTagFilters: ['techno'], genreFilter: null, keyFilter: null, ratingFilter: null }
    s.playlists.push({ id: 1, name: 'Filtered', description: '', created_at: '2024-01-01T00:00:00.000Z', filter_state: JSON.stringify(fs) })

    const playlistsStore = usePlaylistsStore()
    await playlistsStore.loadPlaylists()

    expect(playlistsStore.playlists[0].filterState).toEqual(fs)
  })
})
