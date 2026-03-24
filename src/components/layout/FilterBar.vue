<script setup lang="ts">
import { computed } from 'vue'
import { useTracksStore } from '../../stores/tracks'
import { usePlaylistView } from '../../composables/usePlaylistView'
import { usePlaylistSave } from '../../composables/usePlaylistSave'
import { filterTracks } from '../../utils/filterTracks'
import { formatKey } from '../../utils/constants'

const tracksStore = useTracksStore()
const { open: openPlaylistSave } = usePlaylistSave()
const { activePlaylist, playlistTracks, hasRemovals, hasPendingUpdate, updatePlaylist } = usePlaylistView()

// Genre/key source: playlist tracks when viewing a playlist, full collection otherwise
const sourceTracks = computed(() => activePlaylist.value ? playlistTracks.value : tracksStore.allTracks)

// Tracks currently visible after filtering — used for save/update actions
const displayTracks = computed(() =>
  activePlaylist.value
    ? filterTracks(playlistTracks.value, {
        globalSearch: tracksStore.globalSearch,
        activeTagFilters: tracksStore.activeTagFilters,
        genreFilter: tracksStore.genreFilter,
        keyFilter: tracksStore.keyFilter,
        ratingFilter: tracksStore.ratingFilter,
      })
    : tracksStore.filteredTracks
)

const hasAnyFilter = computed(() =>
  tracksStore.activeTagFilters.length > 0 ||
  tracksStore.genreFilter !== null ||
  tracksStore.keyFilter !== null ||
  tracksStore.ratingFilter !== null,
)

// "Update playlist" is active when tracks were removed, a filter is applied, or a suggested update was accepted
const isModified = computed(() =>
  !!activePlaylist.value && (hasRemovals.value || hasPendingUpdate.value || hasAnyFilter.value || !!tracksStore.globalSearch.trim())
)

function getDefaultPlaylistName(): string {
  const hasSearch = !!tracksStore.globalSearch.trim()
  const hasGenre  = tracksStore.genreFilter !== null
  const hasKey    = tracksStore.keyFilter !== null
  const hasRating = tracksStore.ratingFilter !== null
  const tagCount  = tracksStore.activeTagFilters.length
  const nonTagCount = [hasSearch, hasGenre, hasKey, hasRating].filter(Boolean).length

  // Any number of tags with no other filters → join with '-'
  if (nonTagCount === 0 && tagCount > 0) return tracksStore.activeTagFilters.join('-')

  // Single non-tag filter with no tags → derive name from that filter
  if (nonTagCount === 1 && tagCount === 0) {
    if (hasSearch) return tracksStore.globalSearch.trim()
    if (hasGenre)  return tracksStore.genreFilter!
    if (hasKey)    return `${formatKey(tracksStore.keyFilter!, 'standard')} Scale`
    if (hasRating) return `${tracksStore.ratingFilter}+ Stars`
  }

  return ''
}

function saveAsPlaylist() {
  const ids = displayTracks.value.map(t => t.id)
  const filters = {
    globalSearch: tracksStore.globalSearch,
    activeTagFilters: [...tracksStore.activeTagFilters],
    genreFilter: tracksStore.genreFilter,
    keyFilter: tracksStore.keyFilter,
    ratingFilter: tracksStore.ratingFilter,
  }
  // Only save filter state when at least one filter is active (otherwise re-running would always match everything)
  const hasFilters = !!filters.globalSearch.trim() || filters.activeTagFilters.length > 0 ||
    filters.genreFilter !== null || filters.keyFilter !== null || filters.ratingFilter !== null
  openPlaylistSave(getDefaultPlaylistName(), ids, hasFilters ? filters : undefined)
}

async function handleUpdatePlaylist() {
  await updatePlaylist(displayTracks.value.map(t => t.id))
  tracksStore.clearFilters()
}

const genres = computed(() => {
  const unique = new Set(sourceTracks.value.map(t => t.genre).filter(Boolean))
  return [...unique].sort()
})

// All key values present in the source, sorted alphabetically by standard notation
const keys = computed(() => {
  const unique = new Set(sourceTracks.value.map(t => t.musicalKey).filter(Boolean))
  return [...unique].sort((a, b) =>
    (formatKey(a, 'standard') || a).localeCompare(formatKey(b, 'standard') || b)
  )
})
</script>

<template>
  <div class="filter-bar">
    <div class="filter-controls">
      <select
        class="filter-select"
        :class="{ active: tracksStore.genreFilter !== null }"
        :value="tracksStore.genreFilter ?? ''"
        @change="tracksStore.genreFilter = ($event.target as HTMLSelectElement).value || null"
      >
        <option value="">Genre</option>
        <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
      </select>

      <select
        class="filter-select"
        :class="{ active: tracksStore.keyFilter !== null }"
        :value="tracksStore.keyFilter ?? ''"
        @change="tracksStore.keyFilter = ($event.target as HTMLSelectElement).value || null"
      >
        <option value="">Key</option>
        <option v-for="k in keys" :key="k" :value="k">{{ formatKey(k, 'standard') }}</option>
      </select>

      <select
        class="filter-select"
        :class="{ active: tracksStore.ratingFilter !== null }"
        :value="tracksStore.ratingFilter ?? ''"
        @change="tracksStore.ratingFilter = ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null"
      >
        <option value="">Rating</option>
        <option value="1">1+ ★</option>
        <option value="2">2+ ★</option>
        <option value="3">3+ ★</option>
        <option value="4">4+ ★</option>
        <option value="5">5 ★</option>
      </select>
    </div>

    <div v-if="tracksStore.activeTagFilters.length > 0" class="tag-pills">
      <span class="filters-label">Tags:</span>
      <span
        v-for="tag in tracksStore.activeTagFilters"
        :key="tag"
        class="filter-pill"
      >
        {{ tag }}
        <button class="filter-remove" @click="tracksStore.activeTagFilters.splice(tracksStore.activeTagFilters.indexOf(tag), 1)">✕</button>
      </span>
    </div>

    <button v-if="hasAnyFilter" class="filters-clear" @click="tracksStore.clearFilters()">
      Clear all
    </button>

    <!-- In playlist mode: Update playlist button; otherwise: Save as playlist -->
    <button
      v-if="activePlaylist"
      class="btn-update-playlist"
      :disabled="!isModified"
      title="Save changes back to this playlist"
      @click="handleUpdatePlaylist"
    >
      ↑ Update playlist
    </button>
    <button
      v-else
      class="btn-save-playlist"
      title="Save current results as a playlist"
      @click="saveAsPlaylist"
    >
      ⊕ Save as playlist
    </button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.filter-select {
  height: 30px;
  padding: 0 24px 0 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}
.filter-select:hover { border-color: var(--text-secondary); }
.filter-select.active { color: var(--accent); border-color: var(--accent); }

.tag-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filters-label {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px 2px 8px;
  background: rgba(255, 102, 0, 0.15);
  border: 1px solid var(--accent);
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--accent);
}

.filter-remove {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 8px;
  padding: 0;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
}
.filter-remove:hover { opacity: 1; }

.filters-clear {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 10px;
  padding: 2px 4px;
  cursor: pointer;
  flex-shrink: 0;
}
.filters-clear:hover { color: var(--text-primary); }

.btn-save-playlist,
.btn-update-playlist {
  margin-left: auto;
  flex-shrink: 0;
  background: none;
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  padding: 0 10px;
  height: 26px;
  cursor: pointer;
  white-space: nowrap;
}
.btn-save-playlist:hover,
.btn-update-playlist:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.btn-update-playlist:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
