# Traktor Organizer — Build Progress

Last updated: 2026-03-23

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

## BEFORE Phase 2 — Bugs to fix first (code is written, not yet verified)

These three fixes were coded at end of last session but confirmed NOT working in the running app.
**Most likely cause**: app was opened from the built binary (Finder/Dock) rather than `pnpm tauri dev`,
so it ran the old compiled version. Start session by running `pnpm tauri dev` and re-testing.

### 1. Key display — still showing Open Key (e.g. "11d") instead of standard notation
- Code change is in `src/components/tracks/TrackTable.vue` — musicalKey cell now calls `formatKey(val, 'standard')`
- `formatKey` and `OPEN_KEY_TO_STANDARD` map already exist in `src/utils/constants.ts`
- If still broken after dev server check: verify the import of `formatKey` is present at top of TrackTable.vue

### 2. Duration — still showing raw seconds (e.g. "391") instead of m:ss
- Code change is in `src/utils/constants.ts` — `formatDuration` now handles hours: `h:mm:ss` or `m:ss`
- TrackTable.vue already calls `formatDuration(info.getValue())` for the Time column
- If still broken: check the function was saved correctly in constants.ts

### 3. Beatport junk tags — "purchased", "at", "beatportcom" still appearing
- Code change is in `src/services/tag-processor.ts` — `TAG_BLOCKLIST` set filters them on split
- **Important**: the fix only applies to NEW imports. The merge strategy preserves existing tags,
  so re-importing won't remove tags already in the DB for existing tracks.
- Fix: after verifying the blocklist works on a fresh import, run a cleanup to remove stale junk tags.
  One-shot SQL to run via the DB service or a temporary button:
  ```sql
  DELETE FROM track_tags WHERE tag_id IN (SELECT id FROM tags WHERE name IN ('purchased','at','beatportcom','-'));
  DELETE FROM tags WHERE name IN ('purchased','at','beatportcom','-');
  ```

---

## Phase 1.5: Polish + Foundation — NOT STARTED

### 1. Column reordering
- Drag and drop columns left/right in the table header
- All columns draggable except `#` (row number) and cover art
- Persist column order in `localStorage`

### 2. Right-click context menu + playlist creation
- Global: suppress default browser context menu, build a Vue context menu component
- In development builds only: context menu includes a divider + "Reload" and "Inspect Element" at the bottom
- **Tag right-click menu:**
  - "Export as playlist" — filters by that tag, opens export dialog with tag name as default playlist name (editable)
  - "Add to tag blocklist" — adds the tag to the `tag_blocklist` table and removes it from all tracks immediately
- **Playlist from current filter/search:**
  - Small icon button next to the search field, only active when a search is active
  - Clicking it opens the export playlist dialog with the search term as the default name (editable)
- Export dialog is shared between both flows (phase 3 NML export will plug into the same dialog)

### 3. Tag visual style
- Display tag text in ALL CAPS in the UI (no DB change, CSS only)
- Restyle tag pills: darker inset background, slightly glowing/contrasting text, more badge-like (reference: rounded rectangle, not flat chip)
- Keep per-tag color system, just update the shape and text transform

### 4. Track blocklist
- Add `track_blocklist` table (block tracks by artist name) — migration `003_track_blocklist.sql`
- Seed with `Native Instruments` as the first entry
- Tracks matching a blocklisted artist are still imported (for NML round-trip integrity) but hidden in the UI
- Filter blocked tracks out in the Pinia store (`filteredTracks`) so they never appear in the table
- In `useImport.ts` and `database.ts`, rename the local variable `blocklist` → `tagBlocklist` to distinguish from the new `trackBlocklist`

---

## Phase 2: Editing + Filtering — NOT STARTED

1. Tag editing: `TagEditor.vue` (popover/modal with add/remove), autocomplete from existing tags
2. Tag cloud sidebar: `AppSidebar.vue`, `TagCloud.vue` with counts, AND filtering
3. Per-column filters: Genre dropdown, BPM range, Key picker, Rating minimum
4. Genre inline editing (`GenreCell.vue`)
5. Rating click-to-edit (`RatingCell.vue`)
6. Re-import with merge stats summary (UI for showing what changed)

---

## Phase 3: Playlists + Export — NOT STARTED

1. `PlaylistCreate.vue` — auto-name from active filters, editable
2. `PlaylistPanel.vue` — list playlists, view tracks, delete
3. `nml-exporter.ts` — XMLBuilder, full ENTRY + PLAYLISTS structure
4. `PlaylistExport.vue` — save dialog via Tauri, export .nml
5. Export validation

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
