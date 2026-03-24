// A fully loaded track row — DB fields plus derived/joined data used by the UI
export interface TrackRow {
  id: number
  // Visible fields
  title: string
  artist: string
  album: string
  genre: string
  bpm: number | null
  musicalKey: string          // Open Key string (e.g. "10m") — display format applied in UI
  musicalKeyValue: number | null
  duration: number            // Seconds
  durationFloat: number | null
  rating: number              // 0–5 stars
  label: string
  remixer: string
  producer: string
  releaseDate: string
  // Tags — joined from track_tags / tags tables
  tags: string[]
  // File location
  filePath: string
  fileName: string
  nmlDir: string
  nmlFile: string
  nmlVolume: string
  nmlVolumeId: string
  // Hidden fields (needed for NML export)
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
  coverArtId: string
  commentRaw: string
  importDate: string
  audioId: string
}

// Raw DB row as returned by SQLite (snake_case)
export interface TrackDbRow {
  id: number
  title: string
  artist: string
  album: string
  genre: string
  bpm: number | null
  musical_key: string
  musical_key_value: number | null
  duration: number
  duration_float: number | null
  rating: number
  label: string
  remixer: string
  producer: string
  release_date: string
  file_path: string
  file_name: string
  nml_dir: string
  nml_file: string
  nml_volume: string
  nml_volume_id: string
  mix: string
  catalog_no: string
  bitrate: number | null
  filesize: number | null
  play_count: number
  last_played: string
  color: number | null
  loudness_peak: number | null
  loudness_perceived: number | null
  loudness_analyzed: number | null
  bpm_quality: number | null
  key_lyrics: string
  flags: number | null
  cover_art_id: string
  comment_raw: string
  import_date: string
  audio_id: string
}

export function dbRowToTrackRow(row: TrackDbRow, tags: string[]): TrackRow {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    genre: row.genre,
    bpm: row.bpm,
    musicalKey: row.musical_key,
    musicalKeyValue: row.musical_key_value,
    duration: row.duration,
    durationFloat: row.duration_float,
    rating: row.rating,
    label: row.label,
    remixer: row.remixer,
    producer: row.producer,
    releaseDate: row.release_date,
    tags,
    filePath: row.file_path,
    fileName: row.file_name,
    nmlDir: row.nml_dir,
    nmlFile: row.nml_file,
    nmlVolume: row.nml_volume,
    nmlVolumeId: row.nml_volume_id,
    mix: row.mix,
    catalogNo: row.catalog_no,
    bitrate: row.bitrate,
    filesize: row.filesize,
    playCount: row.play_count,
    lastPlayed: row.last_played,
    color: row.color,
    loudnessPeak: row.loudness_peak,
    loudnessPerceived: row.loudness_perceived,
    loudnessAnalyzed: row.loudness_analyzed,
    bpmQuality: row.bpm_quality,
    keyLyrics: row.key_lyrics,
    flags: row.flags,
    coverArtId: row.cover_art_id,
    commentRaw: row.comment_raw,
    importDate: row.import_date,
    audioId: row.audio_id,
  }
}
