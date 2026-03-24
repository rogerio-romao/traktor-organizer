import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getDb } from '../services/database'
import { dbRowToTrackRow, type TrackRow, type TrackDbRow } from '../types/track'

export interface Playlist {
  id: number
  name: string
  description: string
  createdAt: string
  trackCount: number
}

export const usePlaylistsStore = defineStore('playlists', () => {
  const playlists = ref<Playlist[]>([])

  async function loadPlaylists() {
    const db = await getDb()
    const rows = await db.select<{
      id: number; name: string; description: string; created_at: string; track_count: number
    }[]>(
      `SELECT p.id, p.name, p.description, p.created_at,
              COUNT(pt.track_id) AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
    )
    playlists.value = rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.created_at,
      trackCount: r.track_count,
    }))
  }

  async function deletePlaylist(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM playlists WHERE id = $1', [id])
    playlists.value = playlists.value.filter(p => p.id !== id)
  }

  // Loaded on demand when opening a playlist — not kept in store state
  async function loadPlaylistTracks(playlistId: number): Promise<TrackRow[]> {
    const db = await getDb()

    const rows = await db.select<TrackDbRow[]>(
      `SELECT t.* FROM tracks t
       JOIN playlist_tracks pt ON pt.track_id = t.id
       WHERE pt.playlist_id = $1
       ORDER BY pt.position`,
      [playlistId],
    )

    const tagRows = await db.select<{ track_id: number; name: string }[]>(
      `SELECT tt.track_id, tg.name
       FROM track_tags tt
       JOIN tags tg ON tg.id = tt.tag_id
       WHERE tt.track_id IN (
         SELECT track_id FROM playlist_tracks WHERE playlist_id = $1
       )`,
      [playlistId],
    )

    const tagMap = new Map<number, string[]>()
    for (const { track_id, name } of tagRows) {
      const existing = tagMap.get(track_id)
      if (existing) existing.push(name)
      else tagMap.set(track_id, [name])
    }

    return rows.map(row => dbRowToTrackRow(row, tagMap.get(row.id) ?? []))
  }

  return { playlists, loadPlaylists, deletePlaylist, loadPlaylistTracks }
})
