<script setup lang="ts">
import { computed, onMounted } from 'vue';

import AppSidebar from '@/components/layout/AppSidebar.vue';
import FilterBar from '@/components/layout/FilterBar.vue';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import TrackTable from '@/components/tracks/TrackTable.vue';
import { usePlaylistView } from '@/composables/usePlaylistView';
import { useTagsStore } from '@/stores/tags';
import { useTracksStore } from '@/stores/tracks';
import { filterTracks } from '@/utils/filterTracks';

const tracksStore = useTracksStore();
const tagsStore = useTagsStore();
const { activePlaylist, playlistTracks, playlistLoading } = usePlaylistView();

// When in playlist mode, apply the shared filter state to playlist tracks
const displayTracks = computed(() => {
    if (!activePlaylist.value) return;
    return filterTracks(playlistTracks.value, {
        activeTagFilters: tracksStore.activeTagFilters,
        genreFilter: tracksStore.genreFilter,
        globalSearch: tracksStore.globalSearch,
        keyFilter: tracksStore.keyFilter,
        ratingFilter: tracksStore.ratingFilter,
    });
});

onMounted(async () => {
    await tracksStore.loadAllTracks();
    await tagsStore.loadAllTags();
});
</script>

<template>
    <div class="collection-view">
        <AppSidebar />

        <div class="collection-main">
            <ViewHeader v-if="activePlaylist" />
            <FilterBar />
            <TrackTable
                :key="activePlaylist?.id ?? 'collection'"
                :tracks="displayTracks"
                :loading="playlistLoading"
                :storage-namespace="activePlaylist ? 'traktor-playlist' : 'traktor'"
            />
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
