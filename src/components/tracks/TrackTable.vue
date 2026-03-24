<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useVueTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  FlexRender,
  type SortingState,
  type ColumnDef,
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

function roundBpm(val: number | null): string {
  if (!val) return '—'
  const rounded = Math.round(val * 2) / 2
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)
}

function onBodyScroll() {
  if (tableHead.value && scrollContainer.value) {
    tableHead.value.scrollLeft = scrollContainer.value.scrollLeft
  }
}

const columnHelper = createColumnHelper<TrackRow>()

const columns: ColumnDef<TrackRow, any>[] = [
  columnHelper.accessor('id', {
    id: 'rowNumber',
    header: '#',
    size: 44,
    enableSorting: true,
  }),
  columnHelper.display({
    id: 'coverArt',
    header: '',
    size: 56,
    enableSorting: false,
  }),
  columnHelper.accessor('title', {
    header: 'Title',
    size: 200,
  }),
  columnHelper.accessor('artist', {
    header: 'Artist',
    size: 160,
  }),
  columnHelper.accessor('album', {
    header: 'Album',
    size: 160,
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('bpm', {
    header: 'BPM',
    size: 66,
    cell: info => roundBpm(info.getValue()),
  }),
  columnHelper.accessor('musicalKey', {
    header: 'Key',
    size: 56,
    cell: info => formatKey(info.getValue(), 'standard') || '—',
  }),
  columnHelper.accessor('duration', {
    header: 'Time',
    size: 60,
    cell: info => formatDuration(info.getValue()),
  }),
  columnHelper.accessor('genre', {
    header: 'Genre',
    size: 120,
  }),
  columnHelper.accessor('rating', {
    header: 'Rating',
    size: 78,
    enableSorting: true,
  }),
  columnHelper.accessor('tags', {
    header: 'Tags',
    size: 260,
    enableSorting: false,
  }),
  columnHelper.accessor('producer', {
    header: 'Producer',
    size: 120,
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('label', {
    header: 'Label',
    size: 120,
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('remixer', {
    header: 'Remixer',
    size: 120,
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('releaseDate', {
    header: 'Released',
    size: 90,
    cell: info => info.getValue() || '—',
  }),
]

const table = useVueTable({
  get data() { return tracksStore.filteredTracks },
  columns,
  state: {
    get sorting() { return sorting.value },
  },
  onSortingChange: updater => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

const rows = computed(() => table.getRowModel().rows)
const headerGroups = computed(() => table.getHeaderGroups())
const totalColumnsWidth = computed(() =>
  table.getAllLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
)

const ROW_HEIGHT = 44

const virtualizer = useVirtualizer({
  get count() { return rows.value.length },
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 15,
})

const virtualRows = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())
</script>

<template>
  <div class="track-table-wrapper">
    <!-- Sticky header (scrollLeft synced with body) -->
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
          :class="{ sortable: header.column.getCanSort() }"
          @click="header.column.getToggleSortingHandler()?.($event)"
        >
          <span v-if="!header.isPlaceholder">
            {{ typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : '' }}
          </span>
          <span v-if="header.column.getIsSorted() === 'asc'" class="sort-icon">↑</span>
          <span v-else-if="header.column.getIsSorted() === 'desc'" class="sort-icon">↓</span>
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
            position: 'absolute',
            top: 0,
            left: 0,
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
              />
              <TagCell
                v-else-if="cell.column.id === 'tags'"
                :tags="rows[vRow.index].original.tags"
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
  background: var(--bg-secondary, #242424);
  border-bottom: 1px solid var(--border, #333);
}

.header-row {
  display: flex;
}

.header-cell {
  padding: 0 8px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary, #888);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-right: 1px solid var(--border, #333);
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.header-cell.sortable {
  cursor: pointer;
}
.header-cell.sortable:hover {
  color: var(--text-primary, #e0e0e0);
  background: var(--bg-hover, #2a2a2a);
}

.sort-icon {
  color: var(--accent, #ff6600);
  font-size: 10px;
}

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
  color: var(--text-secondary, #666);
  font-size: 13px;
}

.table-row {
  display: flex;
  border-bottom: 1px solid var(--border, #2a2a2a);
}
.table-row:hover {
  background: var(--bg-hover, #2a2a2a);
}

.table-cell {
  padding: 0 8px;
  height: 44px;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--border, #2a2a2a);
  overflow: hidden;
  flex-shrink: 0;
}

.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, #e0e0e0);
}

.row-number {
  color: var(--text-secondary, #666);
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
  color: var(--text-secondary, #666);
  border-top: 1px solid var(--border, #333);
  background: var(--bg-secondary, #242424);
}
</style>
