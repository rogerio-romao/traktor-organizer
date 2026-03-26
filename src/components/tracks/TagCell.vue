<script setup lang="ts">
import { getTagColor } from '../../utils/tag-colors'
import { useContextMenu } from '../../composables/useContextMenu'
import { usePlaylistSave } from '../../composables/usePlaylistSave'
import { useTagEditor } from '../../composables/useTagEditor'
import { addToTagBlocklist } from '../../services/database'
import { useTracksStore } from '../../stores/tracks'
import { useTagsStore } from '../../stores/tags'

const props = defineProps<{ tags: string[], trackId: number }>()

const { show } = useContextMenu()
const { open: openPlaylistSave } = usePlaylistSave()
const { open: openTagEditor } = useTagEditor()
const tracksStore = useTracksStore()
const tagsStore = useTagsStore()

async function removeTag(tag: string) {
  await tracksStore.removeTagFromTrack(props.trackId, tag)
  await tagsStore.loadAllTags()
}

function toggleFilter(tag: string) {
  const idx = tracksStore.activeTagFilters.indexOf(tag)
  if (idx >= 0) {
    tracksStore.activeTagFilters.splice(idx, 1)
  } else {
    tracksStore.activeTagFilters.push(tag)
  }
}

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
      :class="{ active: tracksStore.activeTagFilters.includes(tag) }"
      :style="{
        background: getTagColor(tag).bg,
        borderColor: tracksStore.activeTagFilters.includes(tag) ? 'var(--accent)' : getTagColor(tag).border
      }"
      @click="toggleFilter(tag)"
      @contextmenu.prevent="onTagRightClick(tag, $event)"
    >
      {{ tag }}
      <button class="pill-remove" :aria-label="`Remove tag ${tag}`" @click.stop="removeTag(tag)">−</button>
    </span>
    <button class="tag-edit-btn" title="Edit tags" aria-label="Add tag" @click.stop="openTagEditor(trackId)">+</button>
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
  width: 100%;
  height: 100%;
}
.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 5px 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 16px;
  color: var(--text-primary, #e0e0e0);
  cursor: pointer;
}
.tag-pill.active {
  box-shadow: 0 0 0 1px var(--accent);
}
.pill-remove {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  transform: translateY(-1px);
}
.pill-remove:hover {
  color: var(--text-primary);
}
.tag-edit-btn {
  flex-shrink: 0;
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1;
  padding: 1px 5px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.1s;
}
.tag-cell:hover .tag-edit-btn {
  opacity: 1;
}
.tag-edit-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent);
}
</style>
