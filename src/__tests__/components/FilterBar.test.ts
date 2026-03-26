import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createTestingPinia } from '@pinia/testing'
import { nextTick, ref, computed } from 'vue'
import FilterBar from '../../components/layout/FilterBar.vue'
import { useTracksStore } from '../../stores/tracks'
import type { TrackRow } from '../../types/track'

vi.mock('../../composables/usePlaylistView', () => ({
  usePlaylistView: () => ({
    activePlaylist: ref(null),
    playlistTracks: ref([]),
    hasRemovals: computed(() => false),
    hasPendingUpdate: ref(false),
    hasTrackEdits: computed(() => false),
    updatePlaylist: vi.fn(),
  }),
}))
vi.mock('../../composables/usePlaylistSave', () => ({
  usePlaylistSave: () => ({ open: vi.fn() }),
}))
vi.mock('../../composables/useAudioPlayer', () => ({
  useAudioPlayer: () => ({ setQueue: vi.fn() }),
}))

function makeTrack(id: number, overrides: Partial<TrackRow> = {}): TrackRow {
  return {
    id, title: `Track ${id}`, artist: 'Artist', album: '', genre: 'Techno',
    bpm: 130, musicalKey: '4d', musicalKeyValue: 10,
    duration: 300, durationFloat: 300, rating: 3, label: '', remixer: '',
    producer: '', releaseDate: '', tags: [],
    filePath: `/music/track${id}.mp3`, fileName: `track${id}.mp3`,
    nmlDir: '/music/', nmlFile: `track${id}.mp3`, nmlVolume: 'osx', nmlVolumeId: 'osx',
    mix: '', catalogNo: '', bitrate: null, filesize: null,
    playCount: 0, lastPlayed: '', color: null,
    loudnessPeak: null, loudnessPerceived: null, loudnessAnalyzed: null,
    bpmQuality: null, keyLyrics: '', flags: null,
    coverArtId: '', commentRaw: '', importDate: '', audioId: '',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

function renderBar(extraTracks: TrackRow[] = []) {
  const tracks = [
    makeTrack(1, { genre: 'Techno', musicalKey: '4d' }),
    makeTrack(2, { genre: 'House', musicalKey: '5m' }),
    ...extraTracks,
  ]
  render(FilterBar, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            tracks: {
              allTracks: tracks,
              genreFilter: null,
              keyFilter: null,
              ratingFilter: null,
              activeTagFilters: [],
              globalSearch: '',
            },
          },
          stubActions: true,
        }),
      ],
    },
  })
  return useTracksStore()
}

describe('FilterBar', () => {
  it('genre select updates genreFilter on the store', async () => {
    const store = renderBar()
    await userEvent.selectOptions(screen.getByLabelText('Genre'), 'Techno')
    expect(store.genreFilter).toBe('Techno')
  })

  it('key select updates keyFilter on the store', async () => {
    const store = renderBar()
    await userEvent.selectOptions(screen.getByLabelText('Key'), '4d')
    expect(store.keyFilter).toBe('4d')
  })

  it('rating select updates ratingFilter on the store', async () => {
    const store = renderBar()
    await userEvent.selectOptions(screen.getByLabelText('Rating'), '3')
    expect(store.ratingFilter).toBe(3)
  })

  it('"Clear all" button is hidden when no filters are active', () => {
    renderBar()
    expect(screen.queryByRole('button', { name: /Clear all/i })).toBeNull()
  })

  it('"Clear all" button calls clearFilters when a filter is active', async () => {
    const store = renderBar()
    store.genreFilter = 'Techno'
    await nextTick()
    await userEvent.click(screen.getByRole('button', { name: /Clear all/i }))
    expect(store.clearFilters).toHaveBeenCalled()
  })
})
