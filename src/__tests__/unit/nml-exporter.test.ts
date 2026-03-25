import { describe, it, expect } from 'vitest'
import { buildPlaylistNml } from '../../services/nml-exporter'
import type { TrackRow } from '../../types/track'

function makeTrack(overrides: Partial<TrackRow> = {}): TrackRow {
  return {
    id: 1,
    title: 'Test Title',
    artist: 'Test Artist',
    album: 'Test Album',
    genre: 'House',
    bpm: 128,
    musicalKey: '4d',
    musicalKeyValue: 10,
    duration: 360,
    durationFloat: 360.5,
    rating: 3,
    label: 'Test Label',
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
    bitrate: 320,
    filesize: 1000000,
    playCount: 0,
    lastPlayed: '',
    color: null,
    loudnessPeak: -0.5,
    loudnessPerceived: -6,
    loudnessAnalyzed: -7,
    bpmQuality: 100,
    keyLyrics: '',
    flags: null,
    coverArtId: '',
    commentRaw: '',
    importDate: '',
    audioId: '',
    ...overrides,
  }
}

describe('buildPlaylistNml', () => {
  it('outputs parseable XML containing expected track fields', () => {
    const tracks = [makeTrack({ title: 'My Track', artist: 'DJ Test' })]
    const xml = buildPlaylistNml('Test Playlist', tracks)

    expect(xml).toContain('TITLE="My Track"')
    expect(xml).toContain('ARTIST="DJ Test"')
    expect(xml).toContain('<COLLECTION ENTRIES="1">')
  })

  it('converts stars to ranking (rating * 51)', () => {
    const tracks = [makeTrack({ rating: 3 })]
    const xml = buildPlaylistNml('Test', tracks)

    expect(xml).toContain('RANKING="153"')
  })

  it('serialises tags into COMMENT attribute', () => {
    const tracks = [makeTrack({ tags: ['deep-house', 'techno'], commentRaw: 'original' })]
    const xml = buildPlaylistNml('Test', tracks)

    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const info = doc.querySelector('INFO')
    expect(info?.getAttribute('COMMENT')).toBe('deep-house techno')
  })

  it('uses commentRaw when no tags', () => {
    const tracks = [makeTrack({ tags: [], commentRaw: 'my comment' })]
    const xml = buildPlaylistNml('Test', tracks)

    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const info = doc.querySelector('INFO')
    expect(info?.getAttribute('COMMENT')).toBe('my comment')
  })

  it('escapes <, >, &, " in title/artist fields', () => {
    const tracks = [makeTrack({
      title: 'Test <tag> & "quotes"',
      artist: 'Artist &amp; More',
    })]
    const xml = buildPlaylistNml('Test', tracks)

    expect(xml).toContain('&lt;tag&gt;')
    expect(xml).toContain('&amp; &quot;quotes&quot;')
    expect(xml).toContain('&amp;amp; More')
  })

  it('escapes playlist name', () => {
    const tracks = [makeTrack()]
    const xml = buildPlaylistNml('My <Playlist> & "Test"', tracks)

    expect(xml).toContain('&lt;Playlist&gt;')
    expect(xml).toContain('&amp; &quot;Test&quot;')
  })

  it('includes correct entry count in COLLECTION and PLAYLIST', () => {
    const tracks = [makeTrack(), makeTrack({ id: 2, title: 'Track 2' })]
    const xml = buildPlaylistNml('Test', tracks)

    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const collection = doc.querySelector('COLLECTION')
    const playlist = doc.querySelector('PLAYLIST')
    expect(collection?.getAttribute('ENTRIES')).toBe('2')
    expect(playlist?.getAttribute('ENTRIES')).toBe('2')
  })

  it('handles empty tracks array', () => {
    const xml = buildPlaylistNml('Empty', [])

    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const collection = doc.querySelector('COLLECTION')
    expect(collection?.getAttribute('ENTRIES')).toBe('0')
  })

  it('omits null/undefined optional attributes', () => {
    const tracks = [makeTrack({
      bpm: null,
      bpmQuality: null,
      musicalKeyValue: null,
      bitrate: null,
    })]
    const xml = buildPlaylistNml('Test', tracks)

    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const tempo = doc.querySelector('TEMPO')
    const musicalKey = doc.querySelector('MUSICAL_KEY')
    const info = doc.querySelector('INFO')

    expect(tempo).toBeNull()
    expect(musicalKey).toBeNull()
    expect(info?.getAttribute('BITRATE')).toBeNull()
  })
})