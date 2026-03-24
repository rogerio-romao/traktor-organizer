// Musical key display format preference values
export type KeyDisplayFormat = 'open_key' | 'camelot' | 'standard'

// Map from Open Key notation → Camelot notation
export const OPEN_KEY_TO_CAMELOT: Record<string, string> = {
  '1d': '8B',  '2d': '9B',  '3d': '10B', '4d': '11B', '5d': '12B', '6d': '1B',
  '7d': '2B',  '8d': '3B',  '9d': '4B',  '10d': '5B', '11d': '6B', '12d': '7B',
  '1m': '8A',  '2m': '9A',  '3m': '10A', '4m': '11A', '5m': '12A', '6m': '1A',
  '7m': '2A',  '8m': '3A',  '9m': '4A',  '10m': '5A', '11m': '6A', '12m': '7A',
}

// Map from Open Key notation → standard musical notation
export const OPEN_KEY_TO_STANDARD: Record<string, string> = {
  '1d': 'C',   '2d': 'G',   '3d': 'D',   '4d': 'A',   '5d': 'E',   '6d': 'B',
  '7d': 'F#',  '8d': 'Db',  '9d': 'Ab',  '10d': 'Eb', '11d': 'Bb', '12d': 'F',
  '1m': 'Am',  '2m': 'Em',  '3m': 'Bm',  '4m': 'F#m', '5m': 'C#m', '6m': 'G#m',
  '7m': 'Ebm', '8m': 'Bbm', '9m': 'Fm',  '10m': 'Cm', '11m': 'Gm', '12m': 'Dm',
}

// Map from Traktor's raw MUSICAL_KEY VALUE (0–23) → Open Key notation
// Value 0 means unanalyzed/unknown
export const MUSICAL_KEY_VALUE_TO_OPEN_KEY: Record<number, string> = {
  0:  '',
  1:  '1d',  2:  '8d',  3:  '3d',  4:  '10d', 5:  '5d',  6:  '12d',
  7:  '7d',  8:  '2d',  9:  '9d',  10: '4d',  11: '11d', 12: '6d',
  13: '1m',  14: '8m',  15: '3m',  16: '10m', 17: '5m',  18: '12m',
  19: '7m',  20: '2m',  21: '9m',  22: '4m',  23: '11m',
}

/**
 * Convert an Open Key string to the requested display format.
 * Returns the input unchanged if the format is 'open_key' or the key is unknown.
 */
export function formatKey(openKey: string, format: KeyDisplayFormat): string {
  if (!openKey) return ''
  if (format === 'open_key') return openKey
  if (format === 'camelot') return OPEN_KEY_TO_CAMELOT[openKey] ?? openKey
  if (format === 'standard') return OPEN_KEY_TO_STANDARD[openKey] ?? openKey
  return openKey
}

/**
 * Convert NML RANKING value (0,51,102,153,204,255) to a 0–5 star rating.
 */
export function rankingToStars(ranking: number): number {
  return Math.round(ranking / 51)
}

/**
 * Convert a 0–5 star rating back to NML RANKING value.
 */
export function starsToRanking(stars: number): number {
  return stars * 51
}

/**
 * Format seconds into m:ss or h:mm:ss display string.
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
