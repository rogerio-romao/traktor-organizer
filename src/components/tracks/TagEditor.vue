<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTagEditor } from '../../composables/useTagEditor'
import { useTracksStore } from '../../stores/tracks'
import { useTagsStore } from '../../stores/tags'
import { getTagColor } from '../../utils/tag-colors'

const { visible, trackId, close } = useTagEditor()
const tracksStore = useTracksStore()
const tagsStore = useTagsStore()

const inputValue = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const showSuggestions = ref(false)
const highlightedIndex = ref(-1)

const track = computed(() => tracksStore.allTracks.find(t => t.id === trackId.value))

const normalizedInput = computed(() =>
  inputValue.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
)

const suggestions = computed(() => {
  const currentTags = new Set(track.value?.tags ?? [])
  return tagsStore.allTags
    .filter(t => !currentTags.has(t.name) && (!normalizedInput.value || t.name.includes(normalizedInput.value)))
    .slice(0, 8)
})

// Reset state and focus input each time the dialog opens
watch(visible, (v) => {
  if (v) {
    inputValue.value = ''
    showSuggestions.value = false
    highlightedIndex.value = -1
    nextTick(() => inputEl.value?.focus())
  }
})

// Show/hide dropdown and reset highlight as suggestions update while typing
watch(suggestions, () => {
  highlightedIndex.value = -1
  showSuggestions.value = suggestions.value.length > 0
})

async function addTag(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!normalized || track.value?.tags.includes(normalized)) return
  await tracksStore.addTagToTrack(trackId.value, normalized)
  await tagsStore.loadAllTags()
  inputValue.value = ''
  showSuggestions.value = false
  nextTick(() => inputEl.value?.focus())
}

async function removeTag(tag: string) {
  await tracksStore.removeTagFromTrack(trackId.value, tag)
  await tagsStore.loadAllTags()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showSuggestions.value) {
      showSuggestions.value = false
    } else {
      close()
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1)
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightedIndex.value >= 0 && suggestions.value[highlightedIndex.value]) {
      addTag(suggestions.value[highlightedIndex.value].name)
    } else if (normalizedInput.value) {
      addTag(normalizedInput.value)
    }
  }
}

function onInputBlur() {
  window.setTimeout(() => { showSuggestions.value = false }, 150)
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('tag-editor-backdrop')) {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="tag-editor-backdrop" @mousedown="onBackdropClick">
      <div class="tag-editor-dialog">
        <div class="tag-editor-header">
          <div class="track-info" v-if="track">
            <span class="track-artist">{{ track.artist }}</span>
            <span class="track-sep">—</span>
            <span class="track-title">{{ track.title }}</span>
          </div>
          <button class="btn-close" @click="close">✕</button>
        </div>

        <div class="tag-editor-body">
          <div class="current-tags" v-if="track && track.tags.length > 0">
            <span
              v-for="tag in track.tags"
              :key="tag"
              class="tag-pill"
              :style="{ background: getTagColor(tag).bg, borderColor: getTagColor(tag).border }"
            >
              {{ tag }}
              <button class="tag-remove" @click="removeTag(tag)">✕</button>
            </span>
          </div>
          <p v-else class="no-tags">No tags yet.</p>

          <div class="input-wrapper">
            <input
              ref="inputEl"
              v-model="inputValue"
              class="tag-input"
              type="text"
              placeholder="Add tag…"
              autocomplete="off"
              @keydown="onKeydown"
              @focus="showSuggestions = suggestions.length > 0"
              @blur="onInputBlur"
            />
            <ul v-if="showSuggestions" class="suggestions">
              <li
                v-for="(s, i) in suggestions"
                :key="s.name"
                class="suggestion-item"
                :class="{ highlighted: i === highlightedIndex }"
                @mousedown.prevent="addTag(s.name)"
              >
                <span
                  class="suggestion-pill"
                  :style="{ background: getTagColor(s.name).bg, borderColor: getTagColor(s.name).border }"
                >{{ s.name }}</span>
                <span class="suggestion-count">{{ s.count }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tag-editor-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.tag-editor-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.tag-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.track-info {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  min-width: 0;
}

.track-artist {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-sep {
  color: var(--text-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

.track-title {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 10px;
  padding: 2px 4px;
  flex-shrink: 0;
  line-height: 1;
}
.btn-close:hover { color: var(--text-primary); }

.tag-editor-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.no-tags {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.tag-remove {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 8px;
  padding: 0;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.tag-remove:hover { color: var(--text-primary); }

.input-wrapper {
  position: relative;
}

.tag-input {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}
.tag-input::placeholder { color: var(--text-secondary); }
.tag-input:focus { border-color: var(--accent); }

.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 5px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  cursor: pointer;
  gap: 8px;
}
.suggestion-item:hover,
.suggestion-item.highlighted {
  background: var(--bg-tertiary);
}

.suggestion-pill {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.suggestion-count {
  font-size: 10px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
