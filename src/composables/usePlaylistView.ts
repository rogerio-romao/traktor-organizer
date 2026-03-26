import { computed, ref } from 'vue';

import { filterTracks } from '@/utils/filterTracks';
import { getDb } from '@/services/database';
import { usePlaylistsStore } from '@/stores/playlists';
import { useTracksStore } from '@/stores/tracks';

import type { Playlist } from '@/stores/playlists';
import type { TrackRow } from '@/types/track';
import type { ComputedRef, Ref } from 'vue';

// Module-level singleton — controls which playlist is open in the main view
const activePlaylist = ref<Playlist | null>(null);
const playlistTracks = ref<TrackRow[]>([]);
const playlistLoading = ref(false);
const removedTrackIds = ref(new Set<number>());
const hasPendingUpdate = ref(false);

// Non-null when re-running the saved filters produces a different track set than what's saved
const suggestedTracks = ref<TrackRow[] | null>(null);

// Snapshot of editable fields + tags taken when the playlist is opened or saved.
// Used to detect unsaved in-table edits (tag changes, field edits).
interface TrackSnap {
    tags: string;
    title: string;
    artist: string;
    genre: string;
    rating: number;
}
const playlistSnapshot = ref<Map<number, TrackSnap> | null>(null);

function takeSnapshot(tracks: TrackRow[]): void {
    const snap = new Map<number, TrackSnap>();
    for (const t of tracks) {
        snap.set(t.id, {
            artist: t.artist,
            genre: t.genre,
            rating: t.rating,
            tags: [...t.tags].toSorted().join('\0'),
            title: t.title,
        });
    }
    playlistSnapshot.value = snap;
}

const hasTrackEdits = computed(() => {
    if (!playlistSnapshot.value || !activePlaylist.value) return false;
    for (const track of playlistTracks.value) {
        const snap = playlistSnapshot.value.get(track.id);
        if (!snap) continue;
        if ([...track.tags].toSorted().join('\0') !== snap.tags) return true;
        if (track.title !== snap.title) return true;
        if (track.artist !== snap.artist) return true;
        if (track.genre !== snap.genre) return true;
        if (track.rating !== snap.rating) return true;
    }
    return false;
});

// Resolve loaded tracks to their live allTracks instances so that
// in-place mutations (e.g. tag changes) are immediately visible in the playlist view.
function withLiveObjects(loaded: TrackRow[]): TrackRow[] {
    const live = useTracksStore().allTracks;
    return loaded.map((t) => live.find((a) => a.id === t.id) ?? t);
}

// oxlint-disable-next-line max-lines-per-function
export function usePlaylistView(): {
    activePlaylist: Ref<Playlist | null>;
    applySuggestedUpdate: () => void;
    closePlaylist: () => void;
    hasPendingUpdate: Ref<boolean>;
    hasRemovals: ComputedRef<boolean>;
    hasTrackEdits: ComputedRef<boolean>;
    openPlaylist: (playlist: Playlist) => Promise<void>;
    playlistLoading: Ref<boolean>;
    playlistTracks: Ref<TrackRow[]>;
    removeTrack: (trackId: number) => void;
    suggestedTracks: Ref<TrackRow[] | null>;
    updatePlaylist: (trackIds: number[]) => Promise<void>;
} {
    const hasRemovals = computed(() => removedTrackIds.value.size > 0);

    // oxlint-disable-next-line max-statements
    async function openPlaylist(playlist: Playlist): Promise<void> {
        activePlaylist.value = playlist;
        removedTrackIds.value = new Set();
        hasPendingUpdate.value = false;
        suggestedTracks.value = null;

        playlistLoading.value = true;
        const store = usePlaylistsStore();
        playlistTracks.value = withLiveObjects(
            await store.loadPlaylistTracks(playlist.id),
        );
        takeSnapshot(playlistTracks.value);
        playlistLoading.value = false;

        // Drift detection: re-run the saved filters against the current collection and
        // compare the resulting track ID set against what's actually saved in the playlist.
        if (playlist.filterState) {
            const { allTracks } = useTracksStore();
            if (allTracks.length > 0) {
                const fresh = filterTracks(allTracks, playlist.filterState);
                const savedIds = new Set(playlistTracks.value.map((t) => t.id));
                const freshIds = new Set(fresh.map((t) => t.id));
                const isDifferent =
                    savedIds.size !== freshIds.size ||
                    [...freshIds].some((id) => !savedIds.has(id));
                if (isDifferent) suggestedTracks.value = fresh;
            }
        }
    }

    function closePlaylist(): void {
        activePlaylist.value = null;
        playlistTracks.value = [];
        removedTrackIds.value = new Set();
        hasPendingUpdate.value = false;
        suggestedTracks.value = null;
        playlistSnapshot.value = null;
    }

    function removeTrack(trackId: number): void {
        removedTrackIds.value = new Set([...removedTrackIds.value, trackId]);
        playlistTracks.value = playlistTracks.value.filter(
            (t) => t.id !== trackId,
        );
    }

    function applySuggestedUpdate(): void {
        if (!suggestedTracks.value) return;
        playlistTracks.value = suggestedTracks.value;
        takeSnapshot(playlistTracks.value);
        suggestedTracks.value = null;
        hasPendingUpdate.value = true;
        removedTrackIds.value = new Set();
    }

    // oxlint-disable-next-line max-statements
    async function updatePlaylist(trackIds: number[]): Promise<void> {
        if (!activePlaylist.value) return;
        const db = await getDb();
        const pid = activePlaylist.value.id;
        await db.execute('DELETE FROM playlist_tracks WHERE playlist_id = $1', [
            pid,
        ]);
        await Promise.all(
            trackIds.map((id, i) =>
                db.execute(
                    'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3)',
                    [pid, id, i],
                ),
            ),
        );
        activePlaylist.value = {
            ...activePlaylist.value,
            trackCount: trackIds.length,
        };
        removedTrackIds.value = new Set();
        hasPendingUpdate.value = false;
        suggestedTracks.value = null;
        const store = usePlaylistsStore();
        // Patch the sidebar count immediately before the async reload
        const idx = store.playlists.findIndex((p) => p.id === pid);
        if (idx !== -1)
            store.playlists[idx] = {
                ...store.playlists[idx],
                trackCount: trackIds.length,
            };
        playlistTracks.value = withLiveObjects(
            await store.loadPlaylistTracks(pid),
        );
        takeSnapshot(playlistTracks.value);
        await store.loadPlaylists();
    }

    return {
        activePlaylist,
        applySuggestedUpdate,
        closePlaylist,
        hasPendingUpdate,
        hasRemovals,
        hasTrackEdits,
        openPlaylist,
        playlistLoading,
        playlistTracks,
        removeTrack,
        suggestedTracks,
        updatePlaylist,
    };
}
