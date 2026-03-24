<script setup lang="ts">
import { useTagsStore } from '../../stores/tags'
import { useTracksStore } from '../../stores/tracks'
import { getTagColor } from '../../utils/tag-colors'

const tagsStore = useTagsStore()
const tracksStore = useTracksStore()

function toggleTag(name: string) {
  const idx = tracksStore.activeTagFilters.indexOf(name)
  if (idx >= 0) {
    tracksStore.activeTagFilters.splice(idx, 1)
  } else {
    tracksStore.activeTagFilters.push(name)
  }
}

function isActive(name: string) {
  return tracksStore.activeTagFilters.includes(name)
}
</script>

<template>
  <div class="tag-cloud">
    <div v-if="tagsStore.allTags.length === 0" class="empty">
      No tags yet.
    </div>
    <button
      v-for="tag in tagsStore.allTags"
      :key="tag.name"
      class="tag-pill"
      :class="{ active: isActive(tag.name) }"
      :style="{
        background: getTagColor(tag.name).bg,
        borderColor: isActive(tag.name) ? 'var(--accent)' : getTagColor(tag.name).border
      }"
      @click="toggleTag(tag.name)"
    >{{ tag.name }}</button>
  </div>
</template>

<style scoped>
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
}

.empty {
  font-size: 11px;
  color: var(--text-secondary);
  width: 100%;
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
  color: var(--text-primary);
  white-space: nowrap;
  line-height: 16px;
  cursor: pointer;
  background: none;
}
.tag-pill:hover {
  filter: brightness(1.2);
}
.tag-pill.active {
  box-shadow: 0 0 0 1px var(--accent);
}
</style>
