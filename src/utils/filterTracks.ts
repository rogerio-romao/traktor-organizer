import type { TrackRow } from '../types/track'

export interface TrackFilters {
  globalSearch: string
  activeTagFilters: string[]
  genreFilter: string | null
  keyFilter: string | null
  ratingFilter: number | null
}

export function filterTracks(tracks: TrackRow[], filters: TrackFilters): TrackRow[] {
  let result = tracks

  if (filters.activeTagFilters.length > 0) {
    result = result.filter(t =>
      filters.activeTagFilters.every(tag => t.tags.includes(tag)),
    )
  }

  if (filters.genreFilter) {
    const g = filters.genreFilter.toLowerCase()
    result = result.filter(t => t.genre.toLowerCase() === g)
  }

  if (filters.keyFilter) {
    result = result.filter(t => t.musicalKey === filters.keyFilter)
  }

  if (filters.ratingFilter != null) {
    result = result.filter(t => t.rating >= filters.ratingFilter!)
  }

  if (filters.globalSearch.trim()) {
    const q = filters.globalSearch.trim().toLowerCase()
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q)),
    )
  }

  return result
}
