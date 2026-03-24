# Traktor Organizer — Build Progress

Last updated: 2026-03-24

---

## Phase 1: Import + Table + Tags — COMPLETE

All scaffolding, database, parsing, import, and table rendering is working.

### What's done
- Tauri v2 + Vue 3 + TypeScript + Pinia + Vue Router + Vite project scaffolded
- SQLite via `tauri-plugin-sql` with versioned migrations (`001_initial.sql`)
- All NML fields stored (including hidden round-trip fields)
- Tauri capabilities configured (sql, dialog, fs, asset protocol)
- `nml-parser.ts` — parses Traktor XML, handles BOM, decodes XML entities manually (`processEntities: false` fix for large collections > 1000 entities)
- `tag-processor.ts` — splits Comments field into tags (whitespace split, lowercase, hyphens)
- `cover-art.ts` + Rust `extract_cover_art` command (lofty crate) — extracts embedded cover art, cached in memory, returns base64
- `useImport.ts` — file picker, batch inserts (100 tracks/tx), merge strategy on re-import (keeps app edits for genre/rating/tags)
- `ImportDialog.vue` — modal with idle/progress/done states, shows import stats
- Pinia stores: `tracks.ts` (two-step load, filteredTracks computed with AND tag + global search logic), `tags.ts` (all tags with counts)
- `TrackTable.vue` — TanStack Table v8 + TanStack Virtual v3, div-based virtual scrolling, ~44px rows, sticky header with horizontal scroll sync
- `AppHeader.vue` — app name, global search, Import NML button
- Dark theme (Traktor-like, orange accent `#ff6600`)
- Data persists in SQLite across app restarts
- Virtual scrolling is smooth at 5K+ tracks

### Post-Phase-1 UI polish (also done)
- Horizontal scroll: header `scrollLeft` synced to body on scroll; virtual rows use `totalColumnsWidth` not `100%`
- BPM rounding to nearest 0.5 (`Math.round(val * 2) / 2`)
- Cover art scaled up to 40px (from 28px)
- Row number `#` column (sortable by DB id = import order), displays current view position
- Tag colors: random per-tag, generated once, persisted in `localStorage` (`src/utils/tag-colors.ts`)
- Added columns: Album, Producer, Released (in addition to Title, Artist, BPM, Key, Time, Genre, Rating, Tags, Label, Remixer)

### Current column order
`# | (art) | Title | Artist | Album | BPM | Key | Time | Genre | Rating | Tags | Producer | Label | Remixer | Released`

---

## Phase 1.5: Polish + Foundation — COMPLETE

### What's done

**Pre-Phase-2 bugs fixed:**
- Key display: now shows standard notation (e.g. "4A") via `formatKey(val, 'standard')` in TrackTable.vue
- Duration: now shows `m:ss` / `h:mm:ss` via updated `formatDuration` in constants.ts
- Beatport junk tags: `TAG_BLOCKLIST` in tag-processor.ts filters on import; `runStartupMaintenance()` cleans stale junk tags from DB on app start using the `tag_blocklist` table

**1. Column reordering and resizing**
- Mouse-event-based column drag (HTML5 DnD unreliable in Tauri WKWebView)
- Resize handle is a separate sibling element to avoid drag interference
- Drop indicator shows left/right directional arrow based on drag direction
- `LOCKED_COLS = ['rowNumber', 'coverArt']` — not draggable or resizable
- Column order + sizes persisted in `localStorage` (`traktor-column-order`, `traktor-column-sizes`)

**2. Right-click context menu + playlist creation**
- Global browser context menu suppressed in `App.vue`
- `ContextMenu.vue` + `useContextMenu.ts` — module-level singleton, Teleport to body
- Dev-only Reload + Inspect Element: right-click on the "Traktor Organizer" header-left zone only
- `open_devtools` Tauri command gated behind `#[cfg(debug_assertions)]`
- Tag right-click: "Export as Playlist" + "Add to Tag Blocklist" (via `TagCell.vue`)
- `PlaylistSaveDialog.vue` + `usePlaylistSave.ts` — shared dialog for all save-playlist flows
- ⊕ button in search bar saves current search results as a playlist
- Playlists saved to `playlists` + `playlist_tracks` DB tables

**3. Tag visual style**
- ALL CAPS via CSS `text-transform: uppercase`
- Badge-style: `border-radius: 4px`, `font-weight: 600`, `letter-spacing: 0.07em`
- Per-tag color system updated: `border` field added (border color), text uses `var(--text-primary)`
- Single-row overflow: `flex-wrap: nowrap`, `overflow: hidden`, `gap: 8px`

**4. Track blocklist**
- Migration `003_track_blocklist.sql` — `track_blocklist(artist_name)`, seeded with `Native Instruments`
- Tracks with blocked artists imported (NML round-trip) but hidden in `filteredTracks` via SQL subquery
- `tagBlocklist` rename throughout `useImport.ts` / `database.ts` to distinguish from track blocklist
- Tag blocklist stored in DB (`tag_blocklist` table) — not hardcoded — for future user management

---

## Phase 2: Editing + Filtering — NOT STARTED

1. Tag editing: `TagEditor.vue` (popover/modal with add/remove), autocomplete from existing tags
2. Tag cloud sidebar: `AppSidebar.vue`, `TagCloud.vue` with counts, AND filtering; active filters shown as dismissible pills
3. Tag pill right-click in table: add "Filter by tag" / "Remove from filter" (dynamic label) to the context menu — wires into the same `activeTagFilters` as the sidebar
4. Per-column filters: Genre dropdown, Key picker, Rating minimum
5. Genre inline editing (`GenreCell.vue`)
6. Rating click-to-edit (`RatingCell.vue`)
7. Re-import with merge stats summary (UI for showing what changed)

---

## Phase 3: Playlists + Export — NOT STARTED

Note: saving playlists to the DB is already implemented (done in Phase 1.5 item 2).
The `playlists` and `playlist_tracks` tables are populated. Phase 3 builds the UI on top.

1. `PlaylistPanel.vue` — list saved playlists, view tracks in each, delete
2. `nml-exporter.ts` — XMLBuilder, full ENTRY + PLAYLISTS structure
3. `PlaylistExport.vue` — file save dialog via Tauri, export .nml
4. Export validation

---

## Phase 4: Audio Player — NOT STARTED

1. `useAudioPlayer.ts` — HTML5 Audio + `convertFileSrc()` asset protocol
2. `player.ts` store
3. `AppFooter.vue` + `AudioPlayer.vue` — track info, progress bar, volume
4. `PlayerControls.vue` — play/pause/stop/skip
5. Play button per table row, highlight playing track
6. AIFF: show friendly unsupported error

---

## Key Technical Notes

- **Entity fix**: `processEntities: false` in fast-xml-parser + manual `decodeEntities()` for `&amp; &apos; &quot; &lt; &gt;`
- **BOM**: stripped before parsing (`charCodeAt(0) === 0xFEFF`)
- **Asset protocol**: configured in `tauri.conf.json`, CSP includes `media-src asset://`
- **Migrations path**: `include_str!("../migrations/001_initial.sql")` (relative to `src/`)
- **TanStack Virtual key**: must be `String(vRow.key)` — key type is `Key` which includes `bigint`
- **Tag colors**: stored in `localStorage` key `traktor-tag-colors` as `{ [tagName]: { bg, text } }`
- **Merge key**: `file_path` (UNIQUE in DB) — re-import matches on this
- **Rating mapping**: Traktor RANKING (0/51/102/153/204/255) → 0–5 stars via `Math.round(ranking / 51)`
