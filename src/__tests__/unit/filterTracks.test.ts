import { describe, it, expect } from 'vitest'
import { filterTracks } from '../../utils/filterTracks'
import type { TrackRow } from '../../types/track'

function makeTrack(overrides: Partial<TrackRow> = {}): TrackRow {
  return {
    id: 1,
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    genre: 'House',
    bpm: 128,
    musicalKey: '4d',
    musicalKeyValue: 10,
    duration: 360,
    durationFloat: null,
    rating: 3,
    label: '',
    remixer: '',
    producer: '',
    releaseDate: '',
    tags: [],
    filePath: '/path/to/track.mp3',
    fileName: 'track.mp3',
    nmlDir: '/:path/:to/:',
    nmlFile: 'track.mp3',
    nmlVolume: 'osx',
    nmlVolumeId: 'osx',
    mix: '',
    catalogNo: '',
    bitrate: null,
    filesize: null,
    playCount: 0,
    lastPlayed: '',
    color: null,
    loudnessPeak: null,
    loudnessPerceived: null,
    loudnessAnalyzed: null,
    bpmQuality: null,
    keyLyrics: '',
    flags: null,
    coverArtId: '',
    commentRaw: '',
    importDate: '',
    audioId: '',
    ...overrides,
  }
}

describe('filterTracks', () => {
  const tracks = [
    makeTrack({ id: 1, title: 'Night Drive', artist: 'DJ Synth', album: 'Midnight', genre: 'Techno', musicalKey: '5m', rating: 4, tags: ['dark', 'night'] }),
    makeTrack({ id: 2, title: 'Sunrise', artist: 'Morning Crew', album: 'Dawn', genre: 'House', musicalKey: '4d', rating: 2, tags: ['uplifting', 'morning'] }),
    makeTrack({ id: 3, title: 'Deep Thoughts', artist: 'Deep DJ', album: 'Abyss', genre: 'Deep House', musicalKey: '6m', rating: 5, tags: ['dark', 'deep'] }),
    makeTrack({ id: 4, title: 'Techno Thing', artist: 'Techno King', album: 'Factory', genre: 'Techno', musicalKey: '10m', rating: 1, tags: [] }),
  ]

  it('returns full input when no filters active', () => {
    const result = filterTracks(tracks, {
      globalSearch: '',
      activeTagFilters: [],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(4)
  })

  it('filters by global search (case-insensitive partial match on title, artist, album, genre)', () => {
    const result = filterTracks(tracks, {
      globalSearch: 'techno',
      activeTagFilters: [],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toEqual([1, 4])
  })

  it('global search matches tags', () => {
    const result = filterTracks(tracks, {
      globalSearch: 'dark',
      activeTagFilters: [],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toEqual([1, 3])
  })

  it('filters by genre (case-insensitive exact match)', () => {
    const result = filterTracks(tracks, {
      globalSearch: '',
      activeTagFilters: [],
      genreFilter: 'techno',
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toEqual([1, 4])
  })

  it('filters by key (exact match)', () => {
    const result = filterTracks(tracks, {
      globalSearch: '',
      activeTagFilters: [],
      genreFilter: null,
      keyFilter: '5m',
      ratingFilter: null,
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('filters by rating (minimum threshold)', () => {
    const result = filterTracks(tracks, {
      globalSearch: '',
      activeTagFilters: [],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: 3,
    })
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toEqual([1, 3])
  })

  it('filters by tags using AND semantics', () => {
    const result = filterTracks(tracks, {
      globalSearch: '',
      activeTagFilters: ['dark'],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toEqual([1, 3])
  })

  it('tags AND requires all tags present', () => {
    const result = filterTracks(tracks, {
      globalSearch: '',
      activeTagFilters: ['dark', 'night'],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('filters compose correctly (multiple filters)', () => {
    const result = filterTracks(tracks, {
      globalSearch: '',
      activeTagFilters: ['dark'],
      genreFilter: 'techno',
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('handles empty tracks array', () => {
    const result = filterTracks([], {
      globalSearch: 'test',
      activeTagFilters: [],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(0)
  })

  it('handles whitespace-only global search as empty', () => {
    const result = filterTracks(tracks, {
      globalSearch: '   ',
      activeTagFilters: [],
      genreFilter: null,
      keyFilter: null,
      ratingFilter: null,
    })
    expect(result).toHaveLength(4)
  })
})