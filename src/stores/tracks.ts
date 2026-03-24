import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getDb } from '../services/database'
import { dbRowToTrackRow, type TrackRow, type TrackDbRow } from '../types/track'

export const useTracksStore = defineStore('tracks', () => {
  const allTracks = ref<TrackRow[]>([])
  const isLoading = ref(false)

  // ── Filters (Phase 2 will add UI for these) ──────────────────────────────
  const globalSearch = ref('')
  const activeTagFilters = ref<string[]>([])   // AND logic — track must have ALL of these
  const genreFilter = ref<string | null>(null)
  const bpmMin = ref<number | null>(null)
  const bpmMax = ref<number | null>(null)
  const keyFilter = ref<string | null>(null)
  const ratingFilter = ref<number | null>(null) // minimum stars

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredTracks = computed(() => {
    let result = allTracks.value

    if (activeTagFilters.value.length > 0) {
      result = result.filter(t =>
        activeTagFilters.value.every(tag => t.tags.includes(tag)),
      )
    }

    if (genreFilter.value) {
      const g = genreFilter.value.toLowerCase()
      result = result.filter(t => t.genre.toLowerCase() === g)
    }

    if (bpmMin.value != null) {
      result = result.filter(t => t.bpm != null && t.bpm >= bpmMin.value!)
    }
    if (bpmMax.value != null) {
      result = result.filter(t => t.bpm != null && t.bpm <= bpmMax.value!)
    }

    if (keyFilter.value) {
      result = result.filter(t => t.musicalKey === keyFilter.value)
    }

    if (ratingFilter.value != null) {
      result = result.filter(t => t.rating >= ratingFilter.value!)
    }

    if (globalSearch.value.trim()) {
      const q = globalSearch.value.trim().toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q)),
      )
    }

    return result
  })

  // ── Load ─────────────────────────────────────────────────────────────────
  async function loadAllTracks() {
    isLoading.value = true
    try {
      const db = await getDb()

      // Step 1: load all track rows, excluding blocklisted artists
      const rows = await db.select<TrackDbRow[]>(
        'SELECT * FROM tracks WHERE artist NOT IN (SELECT artist_name FROM track_blocklist) ORDER BY artist ASC, title ASC',
      )

      // Step 2: load all track-tag associations in one query
      const tagRows = await db.select<{ track_id: number; name: string }[]>(
        `SELECT tt.track_id, t.name
         FROM track_tags tt
         JOIN tags t ON t.id = tt.tag_id`,
      )

      // Build a map: track_id → tag names[]
      const tagMap = new Map<number, string[]>()
      for (const { track_id, name } of tagRows) {
        const existing = tagMap.get(track_id)
        if (existing) {
          existing.push(name)
        } else {
          tagMap.set(track_id, [name])
        }
      }

      allTracks.value = rows.map(row =>
        dbRowToTrackRow(row, tagMap.get(row.id) ?? []),
      )
    } finally {
      isLoading.value = false
    }
  }

  // ── Editable field updates ────────────────────────────────────────────────
  async function updateGenre(trackId: number, genre: string) {
    const db = await getDb()
    await db.execute(
      "UPDATE tracks SET genre = $1, updated_at = datetime('now') WHERE id = $2",
      [genre, trackId],
    )
    const track = allTracks.value.find(t => t.id === trackId)
    if (track) track.genre = genre
  }

  async function updateRating(trackId: number, rating: number) {
    const db = await getDb()
    await db.execute(
      "UPDATE tracks SET rating = $1, updated_at = datetime('now') WHERE id = $2",
      [rating, trackId],
    )
    const track = allTracks.value.find(t => t.id === trackId)
    if (track) track.rating = rating
  }

  async function addTagToTrack(trackId: number, tagName: string) {
    const normalized = tagName.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!normalized) return

    const db = await getDb()
    await db.execute('INSERT OR IGNORE INTO tags (name) VALUES ($1)', [normalized])
    const rows = await db.select<{ id: number }[]>(
      'SELECT id FROM tags WHERE name = $1', [normalized],
    )
    if (!rows[0]) return

    await db.execute(
      'INSERT OR IGNORE INTO track_tags (track_id, tag_id) VALUES ($1, $2)',
      [trackId, rows[0].id],
    )

    const track = allTracks.value.find(t => t.id === trackId)
    if (track && !track.tags.includes(normalized)) {
      track.tags = [...track.tags, normalized]
    }
  }

  async function removeTagFromTrack(trackId: number, tagName: string) {
    const db = await getDb()
    await db.execute(
      `DELETE FROM track_tags
       WHERE track_id = $1
         AND tag_id = (SELECT id FROM tags WHERE name = $2)`,
      [trackId, tagName],
    )
    const track = allTracks.value.find(t => t.id === trackId)
    if (track) {
      track.tags = track.tags.filter(t => t !== tagName)
    }
  }

  function clearFilters() {
    globalSearch.value = ''
    activeTagFilters.value = []
    genreFilter.value = null
    bpmMin.value = null
    bpmMax.value = null
    keyFilter.value = null
    ratingFilter.value = null
  }

  return {
    allTracks,
    filteredTracks,
    isLoading,
    globalSearch,
    activeTagFilters,
    genreFilter,
    bpmMin,
    bpmMax,
    keyFilter,
    ratingFilter,
    loadAllTracks,
    updateGenre,
    updateRating,
    addTagToTrack,
    removeTagFromTrack,
    clearFilters,
  }
})
