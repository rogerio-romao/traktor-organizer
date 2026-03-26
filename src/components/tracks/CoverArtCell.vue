<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { isAiff, useAudioPlayer } from '@/composables/useAudioPlayer';
import { extractCoverArt } from '@/services/cover-art';

import type { TrackRow } from '@/types/track';

const { track } = defineProps<{ track: TrackRow }>();

const { currentTrack, isPlaying, play } = useAudioPlayer();

const dataUrl = ref<string | null>(null);

async function load(): Promise<void> {
    dataUrl.value = await extractCoverArt(track.filePath);
}

onMounted(load);
watch(() => track.filePath, load);

const isCurrentTrack = computed(() => currentTrack.value?.id === track.id);
const aiff = computed(() => isAiff(track));
</script>

<template>
    <div class="cover-art" :class="{ playing: isCurrentTrack && isPlaying }">
        <img v-if="dataUrl" :src="dataUrl" class="cover-img" alt="" />
        <div v-else class="cover-placeholder">♪</div>
        <button
            v-if="!aiff"
            class="play-overlay"
            :class="{ 'always-visible': isCurrentTrack }"
            @click.stop="play(track)"
        >
            {{ isCurrentTrack && isPlaying ? '⏸' : '▶' }}
        </button>
        <div v-else class="aiff-badge" title="AIFF playback not supported">—</div>
    </div>
</template>

<style scoped>
.cover-art {
    position: relative;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
}
.cover-img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 3px;
    display: block;
}
.cover-placeholder {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary, #2e2e2e);
    border-radius: 3px;
    color: var(--text-secondary, #666);
    font-size: 16px;
}

/* Play overlay button */
.play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    border: none;
    border-radius: 3px;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s;
}
.cover-art:hover .play-overlay,
.play-overlay.always-visible {
    opacity: 1;
}

/* Subtle ring on the cell when playing */
.cover-art.playing .cover-img,
.cover-art.playing .cover-placeholder {
    box-shadow: 0 0 0 2px var(--accent);
}

.aiff-badge {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 11px;
}
</style>
