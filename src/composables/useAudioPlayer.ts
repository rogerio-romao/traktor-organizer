import { convertFileSrc } from '@tauri-apps/api/core';
import { computed, ref } from 'vue';

import type { TrackRow } from '@/types/track';

const FADE_MS = 80;
const FADE_SEEK_MS = 35;
const FADE_STEPS = 16;

function fadeIn(audio: HTMLAudioElement, ms = FADE_MS): void {
    audio.volume = 0;
    const step = 1 / FADE_STEPS;
    const interval = ms / FADE_STEPS;
    let vol = 0;
    const t = setInterval(() => {
        vol = Math.min(1, vol + step);
        audio.volume = vol;
        if (vol >= 1) clearInterval(t);
    }, interval);
}

function fadeOut(audio: HTMLAudioElement, ms = FADE_MS): Promise<void> {
    return new Promise((resolve) => {
        const startVol = audio.volume;
        if (startVol === 0) {
            resolve();
            return;
        }
        const step = startVol / FADE_STEPS;
        const interval = ms / FADE_STEPS;
        let vol = startVol;
        const t = setInterval(() => {
            vol = Math.max(0, vol - step);
            audio.volume = vol;
            if (vol <= 0) {
                clearInterval(t);
                resolve();
            }
        }, interval);
    });
}

// Module-level singleton state
const audio = new Audio();
const currentTrack = ref<TrackRow | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const scrollRequest = ref<{ trackId: number; seq: number } | null>(null);
let scrollSeq = 0;
const playError = ref<string | null>(null);
let playErrorTimer: ReturnType<typeof setTimeout> | null = null;
const queue = ref<TrackRow[]>([]);

function setPlayError(msg: string): void {
    if (playErrorTimer) clearTimeout(playErrorTimer);
    playError.value = msg;
    playErrorTimer = setTimeout(() => {
        playError.value = null;
    }, 4000);
}

// oxlint-disable-next-line max-statements
async function loadAndPlay(track: TrackRow): Promise<void> {
    if (isPlaying.value) {
        await fadeOut(audio);
        audio.pause();
    }

    currentTrack.value = track;
    currentTime.value = 0;
    duration.value = 0;
    audio.src = convertFileSrc(track.filePath);
    audio.volume = 0;

    await new Promise<void>((resolve) => {
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            resolve();
            return;
        }
        audio.addEventListener('canplay', () => resolve(), { once: true });
        audio.addEventListener('error', () => resolve(), { once: true });
    });

    try {
        await audio.play();
        fadeIn(audio);
        isPlaying.value = true;
    } catch {
        isPlaying.value = false;
        setPlayError(`Cannot play: ${track.title || track.fileName}`);
        // If in queue mode, skip to next
        if (queue.value.length > 0) {
            const idx = queue.value.findIndex((t) => t.id === track.id);
            if (idx !== -1 && idx < queue.value.length - 1) {
                loadAndPlay(queue.value[idx + 1]);
            }
        }
    }
}

audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime;
});
audio.addEventListener('durationchange', () => {
    duration.value = Number.isNaN(audio.duration) ? 0 : audio.duration;
});
audio.addEventListener('ended', () => {
    if (queue.value.length > 0) {
        const idx = queue.value.findIndex(
            (t) => t.id === currentTrack.value?.id,
        );
        if (idx !== -1 && idx < queue.value.length - 1) {
            loadAndPlay(queue.value[idx + 1]);
        } else {
            isPlaying.value = false;
            queue.value = [];
        }
    } else {
        isPlaying.value = false;
    }
});

let spacebarSetup = false;

export function isAiff(track: TrackRow): boolean {
    const n = track.fileName.toLowerCase();
    return n.endsWith('.aif') || n.endsWith('.aiff');
}

// oxlint-disable-next-line max-lines-per-function, max-statements
export function useAudioPlayer(): {
    currentTime: typeof currentTime;
    currentTrack: typeof currentTrack;
    duration: typeof duration;
    isPlaying: typeof isPlaying;
    play: (track: TrackRow) => Promise<void>;
    playError: typeof playError;
    playNext: () => void;
    playPrev: () => void;
    queue: typeof queue;
    queueIndex: typeof queueIndex;
    scrollRequest: typeof scrollRequest;
    scrollToCurrentTrack: () => void;
    seek: (time: number) => Promise<void>;
    setQueue: (tracks: TrackRow[], startIndex?: number) => void;
    togglePlay: () => Promise<void>;
} {
    if (!spacebarSetup) {
        spacebarSetup = true;
        document.addEventListener('keydown', (e) => {
            if (e.key !== ' ') return;
            const tag = (e.target as Element)?.tagName?.toLowerCase() ?? '';
            if (['input', 'textarea', 'button', 'select'].includes(tag)) return;
            e.preventDefault();
            togglePlay();
        });
    }

    async function play(track: TrackRow): Promise<void> {
        if (isAiff(track)) return;

        if (currentTrack.value?.id === track.id) {
            await togglePlay();
            return;
        }
        // manual selection exits queue mode
        queue.value = [];
        await loadAndPlay(track);
    }

    function setQueue(tracks: TrackRow[], startIndex = 0): void {
        const playable = tracks.filter((t) => !isAiff(t));
        queue.value = playable;
        if (playable.length > 0) {
            loadAndPlay(playable[Math.min(startIndex, playable.length - 1)]);
        }
    }

    async function togglePlay(): Promise<void> {
        if (!currentTrack.value) return;
        if (isPlaying.value) {
            await fadeOut(audio);
            audio.pause();
            isPlaying.value = false;
        } else {
            try {
                await audio.play();
                fadeIn(audio);
                isPlaying.value = true;
            } catch {
                isPlaying.value = false;
            }
        }
    }

    async function seek(time: number): Promise<void> {
        if (isPlaying.value) {
            await fadeOut(audio, FADE_SEEK_MS);
            audio.currentTime = time;
            currentTime.value = time;
            await audio.play();
            fadeIn(audio, FADE_SEEK_MS);
        } else {
            audio.currentTime = time;
            currentTime.value = time;
        }
    }

    function playNext(): void {
        if (queue.value.length === 0) return;
        const idx = queue.value.findIndex(
            (t) => t.id === currentTrack.value?.id,
        );
        if (idx !== -1 && idx < queue.value.length - 1)
            loadAndPlay(queue.value[idx + 1]);
    }

    function playPrev(): void {
        if (queue.value.length === 0) return;
        const idx = queue.value.findIndex(
            (t) => t.id === currentTrack.value?.id,
        );
        if (idx > 0) loadAndPlay(queue.value[idx - 1]);
    }

    const queueIndex = computed(() =>
        queue.value.length > 0
            ? queue.value.findIndex((t) => t.id === currentTrack.value?.id)
            : -1,
    );

    function scrollToCurrentTrack(): void {
        if (currentTrack.value) {
            scrollSeq += 1;
            scrollRequest.value = {
                seq: scrollSeq,
                trackId: currentTrack.value.id,
            };
        }
    }

    return {
        currentTime,
        currentTrack,
        duration,
        isPlaying,
        play,
        playError,
        playNext,
        playPrev,
        queue,
        queueIndex,
        scrollRequest,
        scrollToCurrentTrack,
        seek,
        setQueue,
        togglePlay,
    };
}
