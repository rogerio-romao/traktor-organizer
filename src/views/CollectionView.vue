<script setup lang="ts">
import { onMounted } from 'vue'
import { useTracksStore } from '../stores/tracks'
import { useTagsStore } from '../stores/tags'
import AppSidebar from '../components/layout/AppSidebar.vue'
import TrackTable from '../components/tracks/TrackTable.vue'

const tracksStore = useTracksStore()
const tagsStore = useTagsStore()

onMounted(async () => {
  await tracksStore.loadAllTracks()
  await tagsStore.loadAllTags()
})
</script>

<template>
  <div class="collection-view">
    <AppSidebar />

    <div class="collection-main">
      <div v-if="tracksStore.activeTagFilters.length > 0" class="active-filters">
        <span class="filters-label">Filtering by:</span>
        <span
          v-for="tag in tracksStore.activeTagFilters"
          :key="tag"
          class="filter-pill"
        >
          {{ tag }}
          <button class="filter-remove" @click="tracksStore.activeTagFilters.splice(tracksStore.activeTagFilters.indexOf(tag), 1)">✕</button>
        </span>
        <button class="filters-clear" @click="tracksStore.activeTagFilters = []">
          Clear all
        </button>
      </div>

      <TrackTable />
    </div>
  </div>
</template>

<style scoped>
.collection-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

.collection-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  flex-shrink: 0;
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
  margin-left: 4px;
}
.filters-clear:hover { color: var(--text-primary); }
</style>
