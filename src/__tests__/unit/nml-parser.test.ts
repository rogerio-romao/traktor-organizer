import { describe, it, expect } from 'vitest'
import { parseNmlCollection } from '../../services/nml-parser'

describe('parseNmlCollection', () => {
  it('parses minimal valid NML XML and returns correct field values', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="1">
    <ENTRY TITLE="Test Track" ARTIST="Test Artist">
      <LOCATION DIR="/:path/:to/:" FILE="track.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180" RANKING="0"/>
      <TEMPO BPM="125.5"/>
      <MUSICAL_KEY VALUE="10"/>
    </ENTRY>
  </COLLECTION>
</NML>`

    const tracks = parseNmlCollection(xml)

    expect(tracks).toHaveLength(1)
    expect(tracks[0].title).toBe('Test Track')
    expect(tracks[0].artist).toBe('Test Artist')
    expect(tracks[0].duration).toBe(180)
    expect(tracks[0].bpm).toBe(125.5)
    expect(tracks[0].filePath).toBe('/path/to/track.mp3')
    expect(tracks[0].fileName).toBe('track.mp3')
    expect(tracks[0].nmlDir).toBe('/:path/:to/:')
    expect(tracks[0].nmlVolume).toBe('osx')
  })

  it('decodes XML entities: &amp; → &, &apos; → \'', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="1">
    <ENTRY TITLE="Bob &amp; Alice" ARTIST="It's a &apos;test&apos;">
      <LOCATION DIR="/:path/:to/:" FILE="track.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180"/>
    </ENTRY>
  </COLLECTION>
</NML>`

    const tracks = parseNmlCollection(xml)

    expect(tracks[0].title).toBe('Bob & Alice')
    expect(tracks[0].artist).toBe("It's a 'test'")
  })

  it('converts ranking to stars: 0→0, 51→1, 255→5', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="3">
    <ENTRY TITLE="Zero Stars">
      <LOCATION DIR="/:path/:to/:" FILE="track1.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180" RANKING="0"/>
    </ENTRY>
    <ENTRY TITLE="One Star">
      <LOCATION DIR="/:path/:to/:" FILE="track2.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180" RANKING="51"/>
    </ENTRY>
    <ENTRY TITLE="Five Stars">
      <LOCATION DIR="/:path/:to/:" FILE="track3.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180" RANKING="255"/>
    </ENTRY>
  </COLLECTION>
</NML>`

    const tracks = parseNmlCollection(xml)

    expect(tracks[0].rating).toBe(0)
    expect(tracks[1].rating).toBe(1)
    expect(tracks[2].rating).toBe(5)
  })

  it('converts MUSICAL_KEY VALUE (0–23) to Open Key notation', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="2">
    <ENTRY TITLE="Track1">
      <LOCATION DIR="/:path/:to/:" FILE="track1.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180"/>
      <MUSICAL_KEY VALUE="0"/>
    </ENTRY>
    <ENTRY TITLE="Track2">
      <LOCATION DIR="/:path/:to/:" FILE="track2.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180"/>
      <MUSICAL_KEY VALUE="10"/>
    </ENTRY>
  </COLLECTION>
</NML>`

    const tracks = parseNmlCollection(xml)

    expect(tracks[0].musicalKey).toBe('')
    expect(tracks[0].musicalKeyValue).toBe(0)
    expect(tracks[1].musicalKey).toBe('4d')
    expect(tracks[1].musicalKeyValue).toBe(10)
  })

  it('prefers INFO KEY over MUSICAL_KEY VALUE', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="1">
    <ENTRY TITLE="Track">
      <LOCATION DIR="/:path/:to/:" FILE="track.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180" KEY="5m"/>
      <MUSICAL_KEY VALUE="10"/>
    </ENTRY>
  </COLLECTION>
</NML>`

    const tracks = parseNmlCollection(xml)

    expect(tracks[0].musicalKey).toBe('5m')
  })

  it('skips entries missing LOCATION or FILE', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="2">
    <ENTRY TITLE="Missing FILE">
      <LOCATION DIR="/:path/:to/:" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180"/>
    </ENTRY>
    <ENTRY TITLE="Valid Track">
      <LOCATION DIR="/:path/:to/:" FILE="track.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <INFO PLAYTIME="180"/>
    </ENTRY>
  </COLLECTION>
</NML>`

    const tracks = parseNmlCollection(xml)

    expect(tracks).toHaveLength(1)
    expect(tracks[0].title).toBe('Valid Track')
  })

  it('handles empty/malformed XML gracefully', () => {
    expect(() => parseNmlCollection('')).not.toThrow()
    expect(parseNmlCollection('')).toEqual([])

    expect(() => parseNmlCollection('<invalid>')).not.toThrow()
    expect(parseNmlCollection('<invalid>')).toEqual([])

    expect(() => parseNmlCollection('<NML></NML>')).not.toThrow()
    expect(parseNmlCollection('<NML></NML>')).toEqual([])
  })

  it('handles UTF-8 BOM', () => {
    const bomXml = '\uFEFF<?xml version="1.0" encoding="UTF-8"?><NML VERSION="19"><COLLECTION ENTRIES="1"><ENTRY TITLE="Test"><LOCATION DIR="/:path/:to/:" FILE="track.mp3" VOLUME="osx" VOLUMEID="osx"/><INFO PLAYTIME="180"/></ENTRY></COLLECTION></NML>'

    const tracks = parseNmlCollection(bomXml)

    expect(tracks).toHaveLength(1)
    expect(tracks[0].title).toBe('Test')
  })

  it('extracts all metadata fields', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NML VERSION="19">
  <COLLECTION ENTRIES="1">
    <ENTRY TITLE="Title" ARTIST="Artist">
      <LOCATION DIR="/:path/:to/:" FILE="track.mp3" VOLUME="osx" VOLUMEID="osx"/>
      <ALBUM TITLE="Album"/>
      <INFO PLAYTIME="180" GENRE="House" RANKING="102" LABEL="Label" REMIXER="Remixer" PRODUCER="Producer" COMMENT="comment" IMPORT_DATE="2024-01-01" RELEASE_DATE="2023-01-01" BITRATE="320" FILESIZE="1000000" PLAYCOUNT="5" LAST_PLAYED="2024-01-02" COVERARTID="abc" KEY_LYRICS="lyrics" FLAGS="1" COLOR="16711680"/>
      <TEMPO BPM="128" BPM_QUALITY="100"/>
      <LOUDNESS PEAK_DB="-0.5" PERCEIVED_DB="-6" ANALYZED_DB="-7"/>
      <MUSICAL_KEY VALUE="12"/>
    </ENTRY>
  </COLLECTION>
</NML>`

    const tracks = parseNmlCollection(xml)

    expect(tracks[0].album).toBe('Album')
    expect(tracks[0].genre).toBe('House')
    expect(tracks[0].label).toBe('Label')
    expect(tracks[0].remixer).toBe('Remixer')
    expect(tracks[0].producer).toBe('Producer')
    expect(tracks[0].commentRaw).toBe('comment')
    expect(tracks[0].importDate).toBe('2024-01-01')
    expect(tracks[0].releaseDate).toBe('2023-01-01')
    expect(tracks[0].bitrate).toBe(320)
    expect(tracks[0].filesize).toBe(1000000)
    expect(tracks[0].playCount).toBe(5)
    expect(tracks[0].lastPlayed).toBe('2024-01-02')
    expect(tracks[0].coverArtId).toBe('abc')
    expect(tracks[0].keyLyrics).toBe('lyrics')
    expect(tracks[0].flags).toBe(1)
    expect(tracks[0].color).toBe(16711680)
    expect(tracks[0].loudnessPeak).toBe(-0.5)
    expect(tracks[0].loudnessPerceived).toBe(-6)
    expect(tracks[0].loudnessAnalyzed).toBe(-7)
    expect(tracks[0].bpmQuality).toBe(100)
  })
})