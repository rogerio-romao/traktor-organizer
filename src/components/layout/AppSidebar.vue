<script setup lang="ts">
    import { ref } from 'vue';

    import { useSidebar } from '@/composables/useSidebar';

    import PlaylistPanel from '@/components/playlists/PlaylistPanel.vue';
    import TagCloud from '@/components/tags/TagCloud.vue';

    const { isOpen } = useSidebar();
    const activeTab = ref<'tags' | 'playlists'>(
        (localStorage.getItem('traktor-sidebar-tab') as 'tags' | 'playlists') ??
            'tags',
    );

    function setActiveTab(tab: 'tags' | 'playlists'): void {
        activeTab.value = tab;
        localStorage.setItem('traktor-sidebar-tab', tab);
    }

    const STORAGE_KEY = 'traktor-sidebar-width';
    const MIN_WIDTH = 200;
    const MAX_WIDTH = 400;

    const sidebarWidth = ref(
        Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? '220', 10),
    );
    const isResizing = ref(false);

    function startResize(e: MouseEvent): void {
        e.preventDefault();
        isResizing.value = true;
        const startX = e.clientX;
        const startWidth = sidebarWidth.value;

        function onMove(me: MouseEvent): void {
            sidebarWidth.value = Math.min(
                MAX_WIDTH,
                Math.max(MIN_WIDTH, startWidth + (me.clientX - startX)),
            );
        }

        function onUp(): void {
            isResizing.value = false;
            localStorage.setItem(STORAGE_KEY, String(sidebarWidth.value));
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }
</script>

<template>
    <aside
        class="app-sidebar"
        :class="{ collapsed: !isOpen, resizing: isResizing }"
        :style="isOpen ? { width: sidebarWidth + 'px' } : {}"
    >
        <div class="sidebar-tabs">
            <button
                class="tab-btn"
                :class="{ active: activeTab === 'tags' }"
                @click="setActiveTab('tags')"
                >Tags</button
            >
            <button
                class="tab-btn"
                :class="{ active: activeTab === 'playlists' }"
                @click="setActiveTab('playlists')"
                >Playlists</button
            >
        </div>

        <div class="sidebar-content">
            <TagCloud v-if="activeTab === 'tags'" />
            <PlaylistPanel v-else />
        </div>

        <div class="resize-handle" @mousedown="startResize" />
    </aside>
</template>

<style scoped>
    .app-sidebar {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        background: var(--bg-secondary);
        border-right: 1px solid var(--border);
        overflow: hidden;
        transition: width 0.2s ease;
        position: relative;
    }

    .app-sidebar.collapsed {
        width: 0 !important;
        border-right: none;
    }

    .app-sidebar.resizing {
        transition: none;
    }

    .sidebar-tabs {
        display: flex;
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
    }

    .tab-btn {
        flex: 1;
        height: 40px;
        position: relative;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-secondary);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: pointer;
        white-space: nowrap;
    }
    .tab-btn + .tab-btn::before {
        content: '';
        position: absolute;
        left: 0;
        top: 25%;
        height: 50%;
        width: 1px;
        background: var(--border);
    }
    .tab-btn:hover {
        color: var(--text-primary);
    }
    .tab-btn.active {
        color: var(--accent);
        border-bottom-color: var(--accent);
    }

    .sidebar-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        width: 4px;
        height: 100%;
        cursor: col-resize;
    }
    .resize-handle:hover {
        background: var(--accent);
        opacity: 0.4;
    }
</style>
