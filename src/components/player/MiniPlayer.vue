<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAudioPlayer } from '../../composables/useAudioPlayer'
import { extractCoverArt } from '../../services/cover-art'

const { currentTrack, isPlaying, currentTime, duration, togglePlay, seek, scrollToCurrentTrack } = useAudioPlayer()

const coverDataUrl = ref<string | null>(null)
watch(currentTrack, async (track) => {
  coverDataUrl.value = track ? await extractCoverArt(track.filePath) : null
}, { immediate: true })

const progressPct = computed(() =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
)

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function onScrubberClick(e: MouseEvent) {
  if (!duration.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  void seek(pct * duration.value)
}
</script>

<template>
  <div v-if="currentTrack" class="mini-player">
    <div class="player-cover">
      <img v-if="coverDataUrl" :src="coverDataUrl" class="player-cover-img" alt="" />
      <div v-else class="player-cover-placeholder">♪</div>
    </div>

    <div class="player-info" title="Scroll to track" @click="scrollToCurrentTrack">
      <span class="player-artist">{{ currentTrack.artist }}</span>
      <span class="player-sep">—</span>
      <span class="player-title">{{ currentTrack.title }}</span>
    </div>

    <button class="player-toggle" @click="togglePlay">
      {{ isPlaying ? '⏸' : '▶' }}
    </button>

    <div class="player-scrubber" @click="onScrubberClick">
      <div class="player-progress" :style="{ width: progressPct + '%' }" />
    </div>

    <span class="player-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
  </div>
</template>

<style scoped>
.mini-player {
  flex-shrink: 0;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}

.player-cover {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
}
.player-cover-img {
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: 3px;
  display: block;
}
.player-cover-placeholder {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary, #2e2e2e);
  border-radius: 3px;
  color: var(--text-secondary);
  font-size: 14px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 0 0 260px;
  cursor: pointer;
  overflow: hidden;
}
.player-info:hover .player-artist,
.player-info:hover .player-title { color: var(--accent); }

.player-artist,
.player-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  transition: color 0.1s;
}
.player-sep {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.player-toggle {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border);
  border-radius: 50%;
  color: var(--text-primary);
  font-size: 11px;
  cursor: pointer;
}
.player-toggle:hover { border-color: var(--accent); color: var(--accent); }

.player-scrubber {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}
.player-scrubber:hover { background: var(--text-secondary); }
.player-progress {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  pointer-events: none;
  max-width: 100%;
}

.player-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
