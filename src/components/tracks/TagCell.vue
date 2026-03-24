<script setup lang="ts">
import { getTagColor } from '../../utils/tag-colors'
import { useContextMenu } from '../../composables/useContextMenu'
import { usePlaylistSave } from '../../composables/usePlaylistSave'
import { addToTagBlocklist } from '../../services/database'
import { useTracksStore } from '../../stores/tracks'
import { useTagsStore } from '../../stores/tags'

defineProps<{ tags: string[] }>()

const { show } = useContextMenu()
const { open: openPlaylistSave } = usePlaylistSave()
const tracksStore = useTracksStore()
const tagsStore = useTagsStore()

function onTagRightClick(tag: string, e: MouseEvent) {
  show(e.clientX, e.clientY, [
    {
      label: 'Export as Playlist',
      action: () => {
        const ids = tracksStore.allTracks
          .filter(t => t.tags.includes(tag))
          .map(t => t.id)
        openPlaylistSave(tag, ids)
      },
    },
    {
      label: 'Add to Tag Blocklist',
      action: async () => {
        await addToTagBlocklist(tag)
        await tracksStore.loadAllTracks()
        await tagsStore.loadAllTags()
      },
    },
  ])
}
</script>

<template>
  <div class="tag-cell">
    <span
      v-for="tag in tags"
      :key="tag"
      class="tag-pill"
      :style="{ background: getTagColor(tag).bg, borderColor: getTagColor(tag).border }"
      @contextmenu.prevent="onTagRightClick(tag, $event)"
    >{{ tag }}</span>
  </div>
</template>

<style scoped>
.tag-cell {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  padding: 2px 0;
  overflow: hidden;
}
.tag-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 16px;
  color: var(--text-primary, #e0e0e0);
}
</style>
