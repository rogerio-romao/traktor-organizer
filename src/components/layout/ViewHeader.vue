<script setup lang="ts">
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { computed, ref } from 'vue';

import { useConfirm } from '@/composables/useConfirm';
import { usePlaylistView } from '@/composables/usePlaylistView';
import { buildPlaylistNml } from '@/services/nml-exporter';
import { useTracksStore } from '@/stores/tracks';

const {
    activePlaylist,
    playlistTracks,
    closePlaylist,
    hasTrackEdits,
    hasRemovals,
    hasPendingUpdate,
} = usePlaylistView();
const tracksStore = useTracksStore();
const { confirm } = useConfirm();
const exporting = ref(false);

const isDirty = computed(() => hasTrackEdits.value || hasRemovals.value || hasPendingUpdate.value);

async function goBack(): Promise<void> {
    if (isDirty.value) {
        const ok = await confirm('Unsaved changes will be lost. Go back anyway?', 'Go back');
        if (!ok) return;
    }
    tracksStore.clearFilters();
    closePlaylist();
}

// oxlint-disable-next-line max-statements
async function exportPlaylist(): Promise<void> {
    if (!activePlaylist.value || exporting.value) return;
    if (isDirty.value) {
        const ok = await confirm(
            'Playlist has unsaved changes. Export current state anyway?',
            'Export',
        );
        if (!ok) return;
    }
    exporting.value = true;
    try {
        const path = await save({
            defaultPath: `${activePlaylist.value.name}.nml`,
            filters: [{ extensions: ['nml'], name: 'NML Playlist' }],
        });
        if (!path) return;
        const finalPath = path.endsWith('.nml') ? path : `${path}.nml`;
        const nml = buildPlaylistNml(activePlaylist.value.name, playlistTracks.value);
        await writeTextFile(finalPath, nml);
    } finally {
        exporting.value = false;
    }
}
</script>

<template>
    <div class="view-header">
        <button class="btn-back" @click="goBack">← Collection</button>
        <div class="header-info">
            <span class="playlist-name">{{ activePlaylist!.name }}</span>
            <span class="playlist-meta"
                >{{ playlistTracks.length }} track{{ playlistTracks.length === 1 ? '' : 's' }}</span
            >
        </div>
        <button
            class="btn-export"
            :disabled="exporting"
            title="Export as NML playlist"
            @click="exportPlaylist"
        >
            {{ exporting ? 'Exporting…' : '↓ Export playlist' }}
        </button>
    </div>
</template>

<style scoped>
.view-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    height: 40px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.btn-back {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
}
.btn-back:hover {
    color: var(--accent);
}

.header-info {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex: 1;
    overflow: hidden;
}

.playlist-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.playlist-meta {
    font-size: 11px;
    color: var(--text-secondary);
    flex-shrink: 0;
}

.btn-export {
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
.btn-export:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
}
.btn-export:disabled {
    opacity: 0.4;
    cursor: default;
}
</style>
