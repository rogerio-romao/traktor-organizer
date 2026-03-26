<script setup lang="ts">
    import { addToTagBlocklist } from '@/services/database';
    import { getTagColor } from '@/utils/tag-colors';
    import { useContextMenu } from '@/composables/useContextMenu';
    import { usePlaylistSave } from '@/composables/usePlaylistSave';
    import { useTagsStore } from '@/stores/tags';
    import { useTracksStore } from '@/stores/tracks';

    const tagsStore = useTagsStore();
    const tracksStore = useTracksStore();
    const { show } = useContextMenu();
    const { open: openPlaylistSave } = usePlaylistSave();

    function toggleTag(name: string): void {
        const idx = tracksStore.activeTagFilters.indexOf(name);
        if (idx === -1) {
            tracksStore.activeTagFilters.push(name);
        } else {
            tracksStore.activeTagFilters.splice(idx, 1);
        }
    }

    function isActive(name: string): boolean {
        return tracksStore.activeTagFilters.includes(name);
    }

    function onTagRightClick(tag: string, e: MouseEvent): void {
        show(e.clientX, e.clientY, [
            {
                action: (): void => {
                    const ids = tracksStore.allTracks
                        .filter((t) => t.tags.includes(tag))
                        .map((t) => t.id);
                    openPlaylistSave(tag, ids);
                },
                label: 'Export as Playlist',
            },
            {
                action: async (): Promise<void> => {
                    await addToTagBlocklist(tag);
                    await tracksStore.loadAllTracks();
                    await tagsStore.loadAllTags();
                },
                label: 'Add to Tag Blocklist',
            },
        ]);
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
                borderColor: isActive(tag.name)
                    ? 'var(--accent)'
                    : getTagColor(tag.name).border,
            }"
            @click="toggleTag(tag.name)"
            @contextmenu.prevent="onTagRightClick(tag.name, $event)"
            >{{ tag.name }}</button
        >
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
