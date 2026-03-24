<script setup lang="ts">
import { onMounted } from 'vue'
import { useTracksStore } from '../stores/tracks'
import { useTagsStore } from '../stores/tags'
import AppSidebar from '../components/layout/AppSidebar.vue'
import FilterBar from '../components/layout/FilterBar.vue'
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
      <FilterBar />
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
</style>
