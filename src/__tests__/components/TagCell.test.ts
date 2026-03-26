import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createTestingPinia } from '@pinia/testing'
import TagCell from '../../components/tracks/TagCell.vue'
import { useTracksStore } from '../../stores/tracks'

const mockContextMenuShow = vi.fn()
const mockPlaylistSaveOpen = vi.fn()
const mockTagEditorOpen = vi.fn()

vi.mock('../../composables/useContextMenu', () => ({
  useContextMenu: () => ({ show: mockContextMenuShow }),
}))
vi.mock('../../composables/usePlaylistSave', () => ({
  usePlaylistSave: () => ({ open: mockPlaylistSaveOpen }),
}))
vi.mock('../../composables/useTagEditor', () => ({
  useTagEditor: () => ({ open: mockTagEditorOpen }),
}))
vi.mock('../../services/database', () => ({
  addToTagBlocklist: vi.fn(),
  getDb: vi.fn(),
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  getTagBlocklist: vi.fn().mockResolvedValue(new Set()),
  getTrackBlocklist: vi.fn().mockResolvedValue(new Set()),
  runStartupMaintenance: vi.fn(),
  savePlaylist: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function renderCell(tags: string[], trackId = 42) {
  render(TagCell, {
    props: { tags, trackId },
    global: { plugins: [createTestingPinia()] },
  })
  return useTracksStore()
}

describe('TagCell', () => {
  it('renders tag pills with their text', () => {
    renderCell(['techno', 'dark'])
    expect(screen.getByText('techno')).toBeTruthy()
    expect(screen.getByText('dark')).toBeTruthy()
  })

  it('clicking a tag adds it to activeTagFilters', async () => {
    const store = renderCell(['techno'])
    await userEvent.click(screen.getByText('techno'))
    expect(store.activeTagFilters).toContain('techno')
  })

  it('remove button calls removeTagFromTrack', async () => {
    const store = renderCell(['techno', 'dark'])
    await userEvent.click(screen.getByRole('button', { name: 'Remove tag techno' }))
    expect(store.removeTagFromTrack).toHaveBeenCalledWith(42, 'techno')
  })

  it('"+" button calls openTagEditor with trackId', async () => {
    renderCell(['techno'])
    await userEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    expect(mockTagEditorOpen).toHaveBeenCalledWith(42)
  })

  it('renders no pills when tags array is empty, "+" button still present', () => {
    renderCell([])
    expect(screen.queryByRole('button', { name: /Remove tag/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Add tag' })).toBeTruthy()
  })
})
