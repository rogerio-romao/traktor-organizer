import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createDbState, makeDbMock, type DbState } from './helpers/db-stub'
import { useTracksStore } from '../../stores/tracks'
import { addToTagBlocklist } from '../../services/database'

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState

vi.mock('../../services/database', () => makeDbMock(() => s))

// Seed helpers
function seedTrack(id: number, overrides: Record<string, any> = {}) {
  s.tracks.push({
    id,
    title: `Track ${id}`,
    artist: 'Artist',
    album: '',
    genre: 'House',
    bpm: 128,
    musical_key: '1m',
    musical_key_value: 0,
    duration: 300,
    duration_float: 300.0,
    rating: 3,
    label: '', remixer: '', producer: '', release_date: '',
    file_path: `/music/track${id}.mp3`,
    file_name: `track${id}.mp3`,
    nml_dir: '/music/', nml_file: `track${id}.mp3`, nml_volume: 'osx', nml_volume_id: 'osx',
    mix: '', catalog_no: '', bitrate: null, filesize: null,
    play_count: 0, last_played: '', color: null,
    loudness_peak: null, loudness_perceived: null, loudness_analyzed: null,
    bpm_quality: null, key_lyrics: '', flags: null,
    cover_art_id: '', comment_raw: '', import_date: '', audio_id: '',
    ...overrides,
  })
}

function seedTag(id: number, name: string) {
  s.tags.push({ id, name })
}

function seedTrackTag(trackId: number, tagId: number) {
  s.track_tags.push({ track_id: trackId, tag_id: tagId })
}

beforeEach(() => {
  s = createDbState()
  setActivePinia(createPinia())
})

// ── addTagToTrack ─────────────────────────────────────────────────────────────

describe('addTagToTrack', () => {
  it('creates a new tag row and links it to the track', async () => {
    seedTrack(1)
    const store = useTracksStore()
    store.allTracks = [
      { id: 1, title: 'Track 1', artist: 'Artist', album: '', genre: 'House', bpm: 128,
        musicalKey: '1m', musicalKeyValue: 0, duration: 300, durationFloat: 300, rating: 3,
        label: '', remixer: '', producer: '', releaseDate: '', tags: [],
        filePath: '/music/track1.mp3', fileName: 'track1.mp3', nmlDir: '/music/', nmlFile: 'track1.mp3',
        nmlVolume: 'osx', nmlVolumeId: 'osx', mix: '', catalogNo: '', bitrate: null, filesize: null,
        playCount: 0, lastPlayed: '', color: null, loudnessPeak: null, loudnessPerceived: null,
        loudnessAnalyzed: null, bpmQuality: null, keyLyrics: '', flags: null,
        coverArtId: '', commentRaw: '', importDate: '', audioId: '' },
    ]

    await store.addTagToTrack(1, 'techno')

    expect(s.tags).toHaveLength(1)
    expect(s.tags[0].name).toBe('techno')
    expect(s.track_tags).toHaveLength(1)
    expect(s.track_tags[0]).toMatchObject({ track_id: 1, tag_id: s.tags[0].id })
  })

  it('normalises the tag name before inserting', async () => {
    seedTrack(1)
    const store = useTracksStore()
    store.allTracks = [
      { id: 1, tags: [] } as any,
    ]

    await store.addTagToTrack(1, 'TECHNO')

    expect(s.tags[0].name).toBe('techno')
  })

  it('reuses an existing tag and does not duplicate it', async () => {
    seedTrack(1)
    seedTag(10, 'house')

    const store = useTracksStore()
    store.allTracks = [{ id: 1, tags: [] } as any]

    await store.addTagToTrack(1, 'house')

    expect(s.tags).toHaveLength(1) // no new tag row
    expect(s.track_tags[0].tag_id).toBe(10)
  })

  it('mutates the in-memory TrackRow tags array immediately', async () => {
    seedTrack(1)
    const store = useTracksStore()
    const track: any = { id: 1, tags: [] }
    store.allTracks = [track]

    await store.addTagToTrack(1, 'peak-time')

    expect(track.tags).toContain('peak-time')
  })

  it('does nothing if the tag normalises to an empty string', async () => {
    seedTrack(1)
    const store = useTracksStore()
    store.allTracks = [{ id: 1, tags: [] } as any]

    await store.addTagToTrack(1, '!!!') // only disallowed chars → empty after normalise

    expect(s.tags).toHaveLength(0)
    expect(s.track_tags).toHaveLength(0)
  })
})

// ── removeTagFromTrack ────────────────────────────────────────────────────────

describe('removeTagFromTrack', () => {
  it('removes the track_tag link', async () => {
    seedTrack(1)
    seedTag(5, 'techno')
    seedTrackTag(1, 5)

    const store = useTracksStore()
    store.allTracks = [{ id: 1, tags: ['techno'] } as any]

    await store.removeTagFromTrack(1, 'techno')

    expect(s.track_tags).toHaveLength(0)
  })

  it('deletes an orphaned tag from the tags table', async () => {
    seedTrack(1)
    seedTag(5, 'techno')
    seedTrackTag(1, 5)

    const store = useTracksStore()
    store.allTracks = [{ id: 1, tags: ['techno'] } as any]

    await store.removeTagFromTrack(1, 'techno')

    expect(s.tags).toHaveLength(0)
  })

  it('keeps a tag that is still used by another track', async () => {
    seedTrack(1)
    seedTrack(2)
    seedTag(5, 'techno')
    seedTrackTag(1, 5)
    seedTrackTag(2, 5)

    const store = useTracksStore()
    store.allTracks = [
      { id: 1, tags: ['techno'] } as any,
      { id: 2, tags: ['techno'] } as any,
    ]

    await store.removeTagFromTrack(1, 'techno')

    expect(s.track_tags).toHaveLength(1)
    expect(s.tags).toHaveLength(1) // tag still exists
  })

  it('mutates the in-memory TrackRow tags array immediately', async () => {
    seedTrack(1)
    seedTag(5, 'techno')
    seedTrackTag(1, 5)

    const store = useTracksStore()
    const track: any = { id: 1, tags: ['techno'] }
    store.allTracks = [track]

    await store.removeTagFromTrack(1, 'techno')

    expect(track.tags).not.toContain('techno')
  })
})

// ── addToTagBlocklist ─────────────────────────────────────────────────────────

describe('addToTagBlocklist', () => {
  it('removes the tag and all its track links', async () => {
    seedTrack(1)
    seedTrack(2)
    seedTag(5, 'vocal')
    seedTrackTag(1, 5)
    seedTrackTag(2, 5)

    await addToTagBlocklist('vocal')

    expect(s.track_tags).toHaveLength(0)
    expect(s.tags).toHaveLength(0)
  })

  it('adds the tag name to tag_blocklist', async () => {
    await addToTagBlocklist('vocal')

    expect(s.tag_blocklist.some((r: any) => r.name === 'vocal')).toBe(true)
  })

  it('is idempotent — calling twice does not duplicate the blocklist entry', async () => {
    await addToTagBlocklist('vocal')
    await addToTagBlocklist('vocal')

    expect(s.tag_blocklist.filter((r: any) => r.name === 'vocal')).toHaveLength(1)
  })
})
