import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { open } from '@tauri-apps/plugin-dialog'
import { createDbState, makeDbMock, type DbState } from './helpers/db-stub'
import { useImport } from '../../composables/useImport'

// ── Fixture NML ──────────────────────────────────────────────────────────────

const TRACK_1_NML = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="1">
    <ENTRY TITLE="Night Shift" ARTIST="Dj Surgeon" AUDIO_ID="audio1">
      <LOCATION DIR="/:Users/:dj/:Music/:" FILE="night_shift.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <ALBUM TITLE=""/>
      <INFO GENRE="Techno" RANKING="204" PLAYTIME="360" COMMENT="energetic peak-time" IMPORT_DATE="2024-01-01"/>
      <TEMPO BPM="135.0" BPM_QUALITY="100"/>
      <MUSICAL_KEY VALUE="10"/>
    </ENTRY>
  </COLLECTION>
</NML>`

const TRACK_2_NML = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="2">
    <ENTRY TITLE="Night Shift" ARTIST="Dj Surgeon" AUDIO_ID="audio1">
      <LOCATION DIR="/:Users/:dj/:Music/:" FILE="night_shift.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <ALBUM TITLE=""/>
      <INFO GENRE="Techno" RANKING="204" PLAYTIME="360" COMMENT="energetic peak-time" IMPORT_DATE="2024-01-01"/>
      <TEMPO BPM="135.0" BPM_QUALITY="100"/>
      <MUSICAL_KEY VALUE="10"/>
    </ENTRY>
    <ENTRY TITLE="Blue Monday" ARTIST="New Order" AUDIO_ID="audio2">
      <LOCATION DIR="/:Users/:dj/:Music/:" FILE="blue_monday.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <ALBUM TITLE="Power Corruption &amp; Lies"/>
      <INFO GENRE="Synth-pop" RANKING="255" PLAYTIME="430" COMMENT="classic" IMPORT_DATE="2024-01-02"/>
      <TEMPO BPM="117.0"/>
    </ENTRY>
  </COLLECTION>
</NML>`

// NML with a blocklisted tag in the comment
const BLOCKLIST_NML = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="1">
    <ENTRY TITLE="Blocked Tag Track" ARTIST="Some Artist" AUDIO_ID="audio3">
      <LOCATION DIR="/:Users/:dj/:Music/:" FILE="blocked.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO GENRE="House" RANKING="102" PLAYTIME="300" COMMENT="good blocked-word other"/>
    </ENTRY>
  </COLLECTION>
</NML>`

// ── Test setup ───────────────────────────────────────────────────────────────

let s: DbState

vi.mock('../../services/database', () => makeDbMock(() => s))

beforeEach(() => {
  s = createDbState()
  setActivePinia(createPinia())
  vi.mocked(open).mockResolvedValue('/fake/path/collection.nml')
  vi.mocked(readTextFile).mockResolvedValue(TRACK_1_NML)
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('import pipeline', () => {
  it('importing a fixture NML creates the expected track rows', async () => {
    const { pickAndImport } = useImport()
    const stats = await pickAndImport()

    expect(stats).not.toBeNull()
    expect(s.tracks).toHaveLength(1)

    const track = s.tracks[0]
    expect(track.title).toBe('Night Shift')
    expect(track.artist).toBe('Dj Surgeon')
    expect(track.genre).toBe('Techno')
    expect(track.rating).toBe(4)          // RANKING 204 → 4 stars
    expect(track.bpm).toBe(135.0)
    expect(track.musical_key).toBe('4d')   // VALUE 10 → 4d
    expect(track.file_path).toBe('/Users/dj/Music/night_shift.mp3')
  })

  it('ImportStats totals are accurate on a fresh import', async () => {
    vi.mocked(readTextFile).mockResolvedValue(TRACK_2_NML)
    const { pickAndImport } = useImport()
    const stats = await pickAndImport()

    expect(stats?.total).toBe(2)
    expect(stats?.inserted).toBe(2)
    expect(stats?.updated).toBe(0)
    expect(stats?.skipped).toBe(0)
  })

  it('re-importing the same file updates display fields and reports updated/skipped', async () => {
    // First import
    const { pickAndImport } = useImport()
    await pickAndImport()

    // Simulate user edits: change genre and rating on the DB row
    const track = s.tracks[0]
    track.genre = 'Industrial'
    track.rating = 2

    // Re-import with a changed title (should trigger update, not skip)
    const updatedNml = TRACK_1_NML.replace('Night Shift', 'Night Shift (Edit)')
    vi.mocked(readTextFile).mockResolvedValue(updatedNml)
    const stats2 = await pickAndImport()

    expect(stats2?.updated).toBe(1)
    expect(stats2?.inserted).toBe(0)

    // Display field (title) is updated
    expect(s.tracks[0].title).toBe('Night Shift (Edit)')
    // Editable fields (genre, rating) are preserved
    expect(s.tracks[0].genre).toBe('Industrial')
    expect(s.tracks[0].rating).toBe(2)
  })

  it('re-importing unchanged track increments skipped count', async () => {
    const { pickAndImport } = useImport()
    await pickAndImport()
    // Import exact same NML again
    const stats2 = await pickAndImport()

    expect(stats2?.skipped).toBe(1)
    expect(stats2?.updated).toBe(0)
    expect(s.tracks).toHaveLength(1) // no duplicate rows
  })

  it('tags from comment_raw are extracted and linked to the track', async () => {
    const { pickAndImport } = useImport()
    await pickAndImport()

    // comment "energetic peak-time" → tags: ["energetic", "peak-time"]
    const tagNames = s.tags.map((t: any) => t.name).sort()
    expect(tagNames).toContain('energetic')
    expect(tagNames).toContain('peak-time')

    // Both tags are linked to the track
    expect(s.track_tags).toHaveLength(2)
    expect(s.track_tags.every((tt: any) => tt.track_id === s.tracks[0].id)).toBe(true)
  })

  it('blocklisted tags are not inserted or linked', async () => {
    // Pre-seed a blocklist entry
    s.tag_blocklist.push({ name: 'blocked-word' })

    vi.mocked(readTextFile).mockResolvedValue(BLOCKLIST_NML)
    const { pickAndImport } = useImport()
    await pickAndImport()

    // "blocked-word" must not appear in tags
    const tagNames = s.tags.map((t: any) => t.name)
    expect(tagNames).not.toContain('blocked-word')

    // Other tags from the comment ARE present
    expect(tagNames).toContain('good')
    expect(tagNames).toContain('other')
  })

  it('import stores last_import_dir setting', async () => {
    const { pickAndImport } = useImport()
    await pickAndImport()

    const setting = s.settings.find((x: any) => x.key === 'last_import_dir')
    expect(setting?.value).toBe('/fake/path')
  })
})
