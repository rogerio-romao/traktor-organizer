import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getDb } from '../services/database'

export interface TagWithCount {
  id: number
  name: string
  count: number  // number of tracks that have this tag
}

export const useTagsStore = defineStore('tags', () => {
  const allTags = ref<TagWithCount[]>([])

  async function loadAllTags() {
    const db = await getDb()
    allTags.value = await db.select<TagWithCount[]>(
      `SELECT t.id, t.name, COUNT(tt.track_id) as count
       FROM tags t
       LEFT JOIN track_tags tt ON tt.tag_id = t.id
       GROUP BY t.id
       ORDER BY count DESC, t.name ASC`,
    )
  }

  return { allTags, loadAllTags }
})
