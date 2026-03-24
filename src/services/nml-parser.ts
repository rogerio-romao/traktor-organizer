import { XMLParser } from 'fast-xml-parser'
import type { NmlCollection, NmlEntry } from '../types/nml'
import { nmlLocationToFilePath } from '../utils/nml-path'
import { rankingToStars, MUSICAL_KEY_VALUE_TO_OPEN_KEY } from '../utils/constants'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseAttributeValue: false,  // Keep everything as strings; we parse manually
  trimValues: true,
  processEntities: false,      // Disable to avoid expansion limit on large collections
  isArray: (name) => ['ENTRY', 'CUE_V2', 'NODE'].includes(name),
})

// Decode the standard XML entities that Traktor uses in track names/metadata
function decodeEntities(str: string | undefined): string {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

// The shape of a parsed track ready for database insertion
export interface ParsedTrack {
  // Visible fields
  title: string
  artist: string
  album: string
  genre: string
  bpm: number | null
  musicalKey: string        // Open Key text e.g. "10m"
  musicalKeyValue: number | null
  duration: number          // Seconds (integer)
  durationFloat: number | null
  rating: number            // 0–5 stars
  label: string
  remixer: string
  producer: string
  releaseDate: string
  // Hidden fields (preserved for round-trip NML export)
  mix: string
  catalogNo: string
  bitrate: number | null
  filesize: number | null
  playCount: number
  lastPlayed: string
  color: number | null
  loudnessPeak: number | null
  loudnessPerceived: number | null
  loudnessAnalyzed: number | null
  bpmQuality: number | null
  keyLyrics: string
  flags: number | null
  // File location
  filePath: string          // Full OS path (merge key)
  fileName: string
  nmlDir: string
  nmlFile: string
  nmlVolume: string
  nmlVolumeId: string
  // Other
  coverArtId: string
  commentRaw: string
  importDate: string
  audioId: string
}

/**
 * Parse the XML content of a Traktor collection.nml file.
 * Returns an array of ParsedTrack objects ready for database insertion.
 * Invalid entries (missing LOCATION or file path) are skipped.
 */
export function parseNmlCollection(xmlContent: string): ParsedTrack[] {
  // Strip UTF-8 BOM if present
  const xml = xmlContent.charCodeAt(0) === 0xFEFF ? xmlContent.slice(1) : xmlContent

  const raw = parser.parse(xml) as NmlCollection

  const entries: NmlEntry[] = raw?.NML?.COLLECTION?.ENTRY ?? []

  const tracks: ParsedTrack[] = []

  for (const entry of entries) {
    const loc = entry.LOCATION
    if (!loc?.['@_FILE'] || !loc?.['@_DIR']) continue

    const filePath = nmlLocationToFilePath(
      loc['@_DIR'],
      loc['@_FILE'],
      loc['@_VOLUME'] ?? '',
    )
    if (!filePath) continue

    const info = entry.INFO ?? {}
    const tempo = entry.TEMPO ?? {}
    const loudness = entry.LOUDNESS ?? {}
    const musicalKeyRaw = entry.MUSICAL_KEY?.['@_VALUE']
    const musicalKeyValue = musicalKeyRaw != null ? parseInt(musicalKeyRaw, 10) : null

    // Prefer the text key from INFO (already in Open Key format like "10m")
    // Fall back to converting the numeric MUSICAL_KEY value
    let musicalKey = info['@_KEY'] ?? ''
    if (!musicalKey && musicalKeyValue != null) {
      musicalKey = MUSICAL_KEY_VALUE_TO_OPEN_KEY[musicalKeyValue] ?? ''
    }

    const ranking = parseInt(info['@_RANKING'] ?? '0', 10)

    tracks.push({
      title: decodeEntities(entry['@_TITLE']),
      artist: decodeEntities(entry['@_ARTIST']),
      album: decodeEntities(entry.ALBUM?.['@_TITLE']),
      genre: decodeEntities(info['@_GENRE']),
      bpm: tempo['@_BPM'] ? parseFloat(tempo['@_BPM']) : null,
      musicalKey,
      musicalKeyValue: isNaN(musicalKeyValue ?? NaN) ? null : musicalKeyValue,
      duration: parseInt(info['@_PLAYTIME'] ?? '0', 10),
      durationFloat: info['@_PLAYTIME_FLOAT'] ? parseFloat(info['@_PLAYTIME_FLOAT']) : null,
      rating: isNaN(ranking) ? 0 : rankingToStars(ranking),
      label: decodeEntities(info['@_LABEL']),
      remixer: decodeEntities(info['@_REMIXER']),
      producer: decodeEntities(info['@_PRODUCER']),
      releaseDate: info['@_RELEASE_DATE'] ?? '',
      mix: decodeEntities(info['@_MIX']),
      catalogNo: info['@_CATALOG_NO'] ?? '',
      bitrate: info['@_BITRATE'] ? parseInt(info['@_BITRATE'], 10) : null,
      filesize: info['@_FILESIZE'] ? parseInt(info['@_FILESIZE'], 10) : null,
      playCount: parseInt(info['@_PLAYCOUNT'] ?? '0', 10),
      lastPlayed: info['@_LAST_PLAYED'] ?? '',
      color: info['@_COLOR'] ? parseInt(info['@_COLOR'], 10) : null,
      loudnessPeak: loudness['@_PEAK_DB'] ? parseFloat(loudness['@_PEAK_DB']) : null,
      loudnessPerceived: loudness['@_PERCEIVED_DB'] ? parseFloat(loudness['@_PERCEIVED_DB']) : null,
      loudnessAnalyzed: loudness['@_ANALYZED_DB'] ? parseFloat(loudness['@_ANALYZED_DB']) : null,
      bpmQuality: tempo['@_BPM_QUALITY'] ? parseFloat(tempo['@_BPM_QUALITY']) : null,
      keyLyrics: info['@_KEY_LYRICS'] ?? '',
      flags: info['@_FLAGS'] ? parseInt(info['@_FLAGS'], 10) : null,
      filePath,
      fileName: loc['@_FILE'],
      nmlDir: loc['@_DIR'],
      nmlFile: loc['@_FILE'],
      nmlVolume: loc['@_VOLUME'] ?? '',
      nmlVolumeId: loc['@_VOLUMEID'] ?? '',
      coverArtId: info['@_COVERARTID'] ?? '',
      commentRaw: decodeEntities(info['@_COMMENT']),
      importDate: info['@_IMPORT_DATE'] ?? '',
      audioId: entry['@_AUDIO_ID'] ?? '',
    })
  }

  return tracks
}
