<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  useVueTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  FlexRender,
  type SortingState,
  type ColumnDef,
  type ColumnSizingState,
} from '@tanstack/vue-table'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useTracksStore } from '../../stores/tracks'
import { formatDuration, formatKey } from '../../utils/constants'
import type { TrackRow } from '../../types/track'
import CoverArtCell from './CoverArtCell.vue'
import RatingCell from './RatingCell.vue'
import TagCell from './TagCell.vue'

const tracksStore = useTracksStore()
const scrollContainer = ref<HTMLElement | null>(null)
const tableHead = ref<HTMLElement | null>(null)
const sorting = ref<SortingState>([])
const columnOrder       = ref<string[]>([])
const columnSizing      = ref<ColumnSizingState>({})
const columnSizingInfo  = ref({
  columnSizingStart: [] as [string, number][],
  deltaOffset: null as number | null,
  deltaPercentage: null as number | null,
  isResizingColumn: false as string | false,
  startOffset: null as number | null,
  startSize: null as number | null,
})

const LOCKED_COLS = new Set(['rowNumber', 'coverArt'])
const STORAGE_ORDER = 'traktor-column-order'
const STORAGE_SIZES  = 'traktor-column-sizes'

// ── Drag-to-reorder (mouse events — HTML5 DnD unreliable in WKWebView) ────────
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const isDragging = ref(false)

function startColumnDrag(id: string, e: MouseEvent) {
  if (LOCKED_COLS.has(id)) return
  e.preventDefault() // prevents text selection during drag
  draggingId.value = id
  const startX = e.clientX

  function onMove(me: MouseEvent) {
    // Only enter drag mode after 5px movement to preserve click-to-sort
    if (!isDragging.value && Math.abs(me.clientX - startX) < 5) return
    isDragging.value = true

    // Find which header-cell the cursor is over via data-col-id attribute
    const under = document.elementsFromPoint(me.clientX, me.clientY)
    const hit   = under.find(el => (el as HTMLElement).dataset.colId)
    const hovId = hit ? (hit as HTMLElement).dataset.colId! : null
    dragOverId.value = (hovId && hovId !== id && !LOCKED_COLS.has(hovId)) ? hovId : null
  }

  function onUp() {
    if (isDragging.value && draggingId.value && dragOverId.value) {
      const from  = draggingId.value
      const to    = dragOverId.value
      const order = [...columnOrder.value]
      const fi    = order.indexOf(from)
      const ti    = order.indexOf(to)
      if (fi !== -1 && ti !== -1) {
        order.splice(fi, 1)
        order.splice(ti, 0, from)
        columnOrder.value = order
        localStorage.setItem(STORAGE_ORDER, JSON.stringify(order))
      }
    }
    draggingId.value = null
    dragOverId.value = null
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup',   onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup',   onUp)
}

function dragOverSide(colId: string): 'left' | 'right' | null {
  if (!isDragging.value || dragOverId.value !== colId || !draggingId.value) return null
  const fi = columnOrder.value.indexOf(draggingId.value)
  const ti = columnOrder.value.indexOf(colId)
  if (fi === -1 || ti === -1) return null
  return ti > fi ? 'right' : 'left'
}

function onBodyScroll() {
  if (tableHead.value && scrollContainer.value) {
    tableHead.value.scrollLeft = scrollContainer.value.scrollLeft
  }
}

// ── Columns ───────────────────────────────────────────────────────────────────
function roundBpm(val: number | null): string {
  if (!val) return '—'
  const rounded = Math.round(val * 2) / 2
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)
}

const columnHelper = createColumnHelper<TrackRow>()

const columns: ColumnDef<TrackRow, any>[] = [
  columnHelper.accessor('id', {
    id: 'rowNumber',
    header: '#',
    size: 44, minSize: 44, maxSize: 44,
    enableSorting: true,
    enableResizing: false,
  }),
  columnHelper.display({
    id: 'coverArt',
    header: '',
    size: 56, minSize: 56, maxSize: 56,
    enableSorting: false,
    enableResizing: false,
  }),
  columnHelper.accessor('title',      { header: 'Title',    size: 200, minSize: 80 }),
  columnHelper.accessor('artist',     { header: 'Artist',   size: 160, minSize: 80 }),
  columnHelper.accessor('album',      { header: 'Album',    size: 160, minSize: 60, cell: info => info.getValue() || '—' }),
  columnHelper.accessor('bpm',        { header: 'BPM',      size: 66,  minSize: 50, cell: info => roundBpm(info.getValue()) }),
  columnHelper.accessor('musicalKey', { header: 'Key',      size: 56,  minSize: 50, cell: info => formatKey(info.getValue(), 'standard') || '—' }),
  columnHelper.accessor('duration',   { header: 'Time',     size: 60,  minSize: 50, cell: info => formatDuration(info.getValue()) }),
  columnHelper.accessor('genre',      { header: 'Genre',    size: 120, minSize: 60 }),
  columnHelper.accessor('rating',     { header: 'Rating',   size: 78,  minSize: 60, enableSorting: true }),
  columnHelper.accessor('tags',       { header: 'Tags',     size: 260, minSize: 100, enableSorting: false }),
  columnHelper.accessor('producer',   { header: 'Producer', size: 120, minSize: 60, cell: info => info.getValue() || '—' }),
  columnHelper.accessor('label',      { header: 'Label',    size: 120, minSize: 60, cell: info => info.getValue() || '—' }),
  columnHelper.accessor('remixer',    { header: 'Remixer',  size: 120, minSize: 60, cell: info => info.getValue() || '—' }),
  columnHelper.accessor('releaseDate',{ header: 'Released', size: 90,  minSize: 60, cell: info => info.getValue() || '—' }),
]

// ── Table ─────────────────────────────────────────────────────────────────────
const table = useVueTable({
  get data() { return tracksStore.filteredTracks },
  columns,
  state: {
    get sorting()          { return sorting.value },
    get columnOrder()      { return columnOrder.value },
    get columnSizing()     { return columnSizing.value },
    get columnSizingInfo() { return columnSizingInfo.value },
  },
  onSortingChange: u => {
    sorting.value = typeof u === 'function' ? u(sorting.value) : u
  },
  onColumnOrderChange: u => {
    columnOrder.value = typeof u === 'function' ? u(columnOrder.value) : u
    localStorage.setItem(STORAGE_ORDER, JSON.stringify(columnOrder.value))
  },
  onColumnSizingChange: u => {
    columnSizing.value = typeof u === 'function' ? u(columnSizing.value) : u
    localStorage.setItem(STORAGE_SIZES, JSON.stringify(columnSizing.value))
  },
  onColumnSizingInfoChange: u => {
    columnSizingInfo.value = typeof u === 'function' ? u(columnSizingInfo.value) : u
  },
  columnResizeMode: 'onChange',
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

// Initialise order + sizes from localStorage, filling in any missing columns
onMounted(() => {
  const allIds = table.getAllLeafColumns().map(c => c.id)

  try {
    const savedOrder = localStorage.getItem(STORAGE_ORDER)
    if (savedOrder) {
      const parsed: string[] = JSON.parse(savedOrder)
      const valid   = parsed.filter(id => allIds.includes(id))
      const missing = allIds.filter(id => !valid.includes(id))
      columnOrder.value = [...valid, ...missing]
    } else {
      columnOrder.value = allIds
    }
  } catch {
    columnOrder.value = allIds
  }

  try {
    const savedSizes = localStorage.getItem(STORAGE_SIZES)
    if (savedSizes) columnSizing.value = JSON.parse(savedSizes)
  } catch { /* ignore */ }
})

// ── Virtualizer ───────────────────────────────────────────────────────────────
const rows       = computed(() => table.getRowModel().rows)
const headerGroups = computed(() => table.getHeaderGroups())
const totalColumnsWidth = computed(() =>
  table.getAllLeafColumns().reduce((sum, col) => sum + col.getSize(), 0),
)

const ROW_HEIGHT = 44

const virtualizer = useVirtualizer({
  get count() { return rows.value.length },
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 15,
})

const virtualRows = computed(() => virtualizer.value.getVirtualItems())
const totalSize   = computed(() => virtualizer.value.getTotalSize())
</script>

<template>
  <div class="track-table-wrapper" :style="isDragging ? { cursor: 'grabbing', userSelect: 'none' } : {}">
    <!-- Sticky header -->
    <div ref="tableHead" class="table-head">
      <div
        v-for="headerGroup in headerGroups"
        :key="headerGroup.id"
        class="header-row"
        :style="{ width: totalColumnsWidth + 'px' }"
      >
        <div
          v-for="header in headerGroup.headers"
          :key="header.id"
          class="header-cell"
          :style="{ width: header.getSize() + 'px', minWidth: header.getSize() + 'px' }"
          :class="{
            'drag-over-left':  dragOverSide(header.column.id) === 'left',
            'drag-over-right': dragOverSide(header.column.id) === 'right',
          }"
          :data-col-id="header.column.id"
        >
          <!-- Drag + sort area -->
          <div
            class="header-drag-area"
            :class="{
              sortable:  header.column.getCanSort(),
              draggable: !LOCKED_COLS.has(header.column.id),
              dragging:  isDragging && draggingId === header.column.id,
            }"
            @mousedown="startColumnDrag(header.column.id, $event)"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <span v-if="!header.isPlaceholder">
              {{ typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : '' }}
            </span>
            <span v-if="header.column.getIsSorted() === 'asc'"  class="sort-icon">↑</span>
            <span v-else-if="header.column.getIsSorted() === 'desc'" class="sort-icon">↓</span>
          </div>
          <!-- Resize handle — separate from drag area, no interference -->
          <div
            v-if="header.column.getCanResize()"
            class="resize-handle"
            :class="{ resizing: header.column.getIsResizing() }"
            @mousedown.prevent="header.getResizeHandler()($event)"
          />
        </div>
      </div>
    </div>

    <!-- Virtualized body -->
    <div ref="scrollContainer" class="table-body" @scroll="onBodyScroll">
      <div v-if="tracksStore.isLoading" class="empty-state">Loading…</div>
      <div v-else-if="rows.length === 0" class="empty-state">
        {{ tracksStore.allTracks.length === 0 ? 'No tracks imported yet.' : 'No tracks match the current filters.' }}
      </div>
      <div v-else :style="{ height: totalSize + 'px', position: 'relative' }">
        <div
          v-for="vRow in virtualRows"
          :key="String(vRow.key)"
          class="table-row"
          :style="{
            position: 'absolute', top: 0, left: 0,
            width: totalColumnsWidth + 'px',
            height: ROW_HEIGHT + 'px',
            transform: `translateY(${vRow.start}px)`,
          }"
        >
          <template v-if="rows[vRow.index]">
            <div
              v-for="cell in rows[vRow.index].getVisibleCells()"
              :key="cell.id"
              class="table-cell"
              :style="{ width: cell.column.getSize() + 'px', minWidth: cell.column.getSize() + 'px' }"
            >
              <span v-if="cell.column.id === 'rowNumber'" class="cell-text row-number">
                {{ vRow.index + 1 }}
              </span>
              <CoverArtCell
                v-else-if="cell.column.id === 'coverArt'"
                :file-path="rows[vRow.index].original.filePath"
              />
              <RatingCell
                v-else-if="cell.column.id === 'rating'"
                :value="rows[vRow.index].original.rating"
                :track-id="rows[vRow.index].original.id"
              />
              <TagCell
                v-else-if="cell.column.id === 'tags'"
                :tags="rows[vRow.index].original.tags"
                :track-id="rows[vRow.index].original.id"
              />
              <span v-else class="cell-text">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Footer count -->
    <div class="table-footer">
      {{ tracksStore.filteredTracks.length.toLocaleString() }} tracks
      <template v-if="tracksStore.filteredTracks.length !== tracksStore.allTracks.length">
        of {{ tracksStore.allTracks.length.toLocaleString() }}
      </template>
    </div>
  </div>
</template>

<style scoped>
.track-table-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-size: 12px;
}

/* ── Header ─────────────────────────────── */
.table-head {
  flex-shrink: 0;
  overflow-x: hidden;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.header-row { display: flex; }

.header-cell {
  display: flex;
  height: 32px;
  border-right: 1px solid var(--border);
  user-select: none;
  flex-shrink: 0;
  overflow: hidden;
}

.header-cell.drag-over-left  { border-left:  2px solid var(--accent); }
.header-cell.drag-over-right { border-right: 2px solid var(--accent); }

.header-drag-area {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 100%;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.header-drag-area.sortable  { cursor: pointer; }
.header-drag-area.draggable { cursor: grab; }
.header-drag-area.dragging  { opacity: 0.4; cursor: grabbing; }
.header-drag-area.sortable:hover,
.header-drag-area.draggable:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.sort-icon { color: var(--accent); font-size: 10px; }

/* ── Resize handle ──────────────────────── */
.resize-handle {
  width: 6px;
  flex-shrink: 0;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  background: transparent;
  transition: background 0.15s;
}
.resize-handle:hover,
.resize-handle.resizing { background: var(--accent); }

/* ── Body ───────────────────────────────── */
.table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
  font-size: 13px;
}

.table-row {
  display: flex;
  border-bottom: 1px solid var(--border);
}
.table-row:hover { background: var(--bg-hover); }

.table-cell {
  padding: 0 8px;
  height: 44px;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--border);
  overflow: hidden;
  flex-shrink: 0;
}

.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.row-number {
  color: var(--text-secondary);
  font-size: 11px;
  width: 100%;
  text-align: right;
}

/* ── Footer ─────────────────────────────── */
.table-footer {
  flex-shrink: 0;
  height: 26px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 11px;
  color: var(--text-secondary);
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
}
</style>
