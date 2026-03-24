<script setup lang="ts">
import { onMounted } from 'vue'
import { useTracksStore } from '../stores/tracks'
import { useTagsStore } from '../stores/tags'
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
    <TrackTable />
  </div>
</template>

<style scoped>
.collection-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
