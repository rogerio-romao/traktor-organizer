# Testing Plan — Traktor Organizer

## Philosophy

- **Prefer integration tests.** A passing tag-normalize unit test that coexists
  with a broken import pipeline gives no real confidence. Test at the seam where
  multiple pieces work together.
- **No `data-testid`.** Following the principle from
  https://tkdodo.eu/blog/test-ids-are-an-a11y-smell — if an element can't be
  found by an ARIA role and accessible name, the UI needs fixing, not the test.
  Use role-based selectors: `getByRole`, `getByLabelText`, `getByText`, etc.
- **Don't test for coverage.** Skip trivial getters, one-liner utils, and pure
  passthrough wrappers. Test behaviour that can realistically break.
- **Test what users care about.** Can they import a collection? Do filters
  return the right tracks? Does saving a playlist preserve the right metadata?

---

## Tooling

### TypeScript / Vue

| Package                       | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `vitest`                      | Test runner, replaces Jest, native Vite integration |
| `@vitejs/plugin-vue`          | Already in vite.config, needed for Vitest too       |
| `@testing-library/vue`        | Role-based component queries                        |
| `@testing-library/user-event` | Realistic user interaction simulation               |
| `@pinia/testing`              | Isolated store creation with opt-in state stubs     |
| `jsdom`                       | DOM environment for Vitest                          |

Add `test` config to `vite.config.ts` (or a separate `vitest.config.ts`):

- `environment: 'jsdom'`
- `globals: true`
- Mock the Tauri `invoke` / `@tauri-apps/api` modules globally

### Rust

Use the built-in `#[cfg(test)]` module with `cargo test`. No extra crate needed.
The only RS command worth testing is `extract_cover_art`; add a fixture MP3 with
embedded cover art under `src-tauri/tests/fixtures/`.

---

## What NOT to Test

- `useSidebar` — trivial localStorage toggle, no business logic
- `usePlaylistSave` / `useTagEditor` — module-level flag state, no logic
- `AppHeader`, `AppSidebar` rendering in isolation — structural, no behaviour
- `CoverArtCell` Tauri integration — requires real filesystem + Rust
- `open_devtools` Rust command — debug-only, no production value
- 100% branch coverage on `formatDuration` or similar one-liner utils

---

## Test Areas

### 1. Pure Function Unit Tests

_Located in `src/utils/` and `src/services/` — no Tauri, no DOM, no store._

**`src/services/nml-parser.ts`** — `parseNmlCollection`

- Parses minimal valid NML XML and returns correct field values
- Entity decoding: `&amp;` → `&`, `&apos;` → `'`
- Ranking → stars conversion: 0→0, 51→1, 255→5
- Musical key value (0–23) → Open Key notation
- Skips entries missing LOCATION or FILE
- Handles empty/malformed XML gracefully (no throw, empty array)

**`src/services/nml-exporter.ts`** — `buildPlaylistNml`

- Output is parseable XML containing expected track fields
- Stars → ranking round-trip: starsToRanking(rankingToStars(x)) === x
- Tags serialised into COMMENT attribute
- Escapes `<`, `>`, `&`, `"` in title/artist fields

**`src/services/tag-processor.ts`**

- `normalizeTag`: lowercases, removes disallowed characters, preserves
  `-`/`@`/`.`
- `splitCommentIntoTags`: splits on whitespace, deduplicates, applies blocklist
- Tags present in blocklist are excluded; blocklist is case-insensitive

**`src/utils/filterTracks.ts`** — `filterTracks`

- Global search matches title, artist, genre (case-insensitive partial)
- Tag filters use AND semantics (track must have ALL active tags)
- Genre, key, and rating filters compose correctly
- Empty filters return the full input array unchanged

**`src/utils/nml-path.ts`** — `nmlLocationToFilePath`

- `/: prefix` is stripped and replaced with `/`
- Windows drive letter passthrough

**`src/utils/constants.ts`**

- `rankingToStars` / `starsToRanking` are inverses for all valid values
- `formatDuration` edge cases: 0 → `"0:00"`, 3661 → `"1:01:01"`

---

### 2. Integration Tests — Core Flows

_Stores + services wired together; Tauri plugin-sql mocked at the module level._

Mock strategy: mock `@tauri-apps/plugin-sql` to return an in-memory SQLite (via
`sql.js` or a hand-rolled stub that stores state in a plain object), and mock
`@tauri-apps/plugin-dialog` / `@tauri-apps/plugin-fs` for import flows.

**Import pipeline** (`useImport` + `useTracksStore` + `nml-parser` + DB)

- Importing a fixture NML creates the expected track rows
- Re-importing the same file updates display fields but preserves user-edited
  genre, rating, and tags on the existing row (upsert logic)
- Tags from `comment_raw` are extracted and linked; blocklisted tags are skipped
- `ImportStats` totals are accurate (inserted vs updated counts)

**Tag management** (`useTracksStore`)

- `addTagToTrack`: creates tag if new, links to track, refreshes tags store
- `removeTagFromTrack`: unlinks tag, deletes orphaned tags from `tags` table
- `addToTagBlocklist`: removes all existing links for that tag across tracks

**Filter state** (`useTracksStore.filteredTracks`)

- Adding/removing tag filters and checking that `filteredTracks` reacts
  correctly
- Combining search + genre + key + rating filters
- `clearFilters` resets computed to full collection

**Playlist save and drift detection** (`usePlaylistView` + `usePlaylistsStore`)

- Saving a playlist stores the track IDs and filter state
- Re-opening a playlist whose underlying filter_state now yields different
  tracks surfaces `suggestedTracks` (drift detected)
- `applySuggestedUpdate` replaces playlist tracks correctly
- `removeTrack` marks a track for removal; `updatePlaylist` persists the change

**Inline metadata edits** (`useTracksStore`)

- `updateTitle/Artist/Genre` persist to DB and mutate the in-memory TrackRow
- `updateRating` maps stars → ranking before writing, reads back correctly

---

### 3. Component Tests — UI Interactions

_Mounted with Testing Library, real Pinia (via `@pinia/testing`), jsdom._
_Role-based selectors only — no `data-testid`._

**`RatingCell.vue`**

- Renders 5 star elements accessible via their label or role
- Clicking the 3rd star calls the store update with rating=3
- Keyboard: Enter/Space on focused star updates rating

**`EditableTextCell.vue`**

- Displays value as text; double-click reveals an input
- Typing and pressing Enter commits the new value and hides the input
- Pressing Escape reverts and hides the input

**`TagCell.vue`**

- Existing tags render with their text accessible by role
- The add-tag input is accessible by label; typing and pressing Enter calls
  `addTagToTrack` with the normalised value
- Empty input does not submit

**`FilterBar.vue`**

- The search textbox (accessible by its label/role) updates `globalSearch`
- Genre select updates `genreFilter`
- Rating select updates `ratingFilter`
- "Clear filters" button calls `clearFilters`

**`ConfirmDialog.vue`**

- Confirm button resolves the promise with `true`
- Cancel button resolves with `false`
- Dialog is announced as a dialog role with an accessible name

---

### 4. Rust Tests

_Located as `#[cfg(test)]` module in `src-tauri/src/lib.rs`._

**`extract_cover_art`**

- Calling with a path to `tests/fixtures/no-cover.mp3` returns an empty string
- Calling with a path to `tests/fixtures/with-cover.mp3` returns a non-empty
  base64 string that decodes to a valid JPEG

No tests needed for `open_devtools` (debug-only guard, no logic).

---

## File Locations

```
src/
  __tests__/
    unit/
      nml-parser.test.ts
      nml-exporter.test.ts
      tag-processor.test.ts
      filterTracks.test.ts
      constants.test.ts
      nml-path.test.ts
    integration/
      import-pipeline.test.ts
      tag-management.test.ts
      filter-state.test.ts
      playlist-flow.test.ts
      inline-edits.test.ts
    components/
      RatingCell.test.ts
      EditableTextCell.test.ts
      TagCell.test.ts
      FilterBar.test.ts
      ConfirmDialog.test.ts
  test-setup.ts          ← global Tauri mock setup

src-tauri/
  tests/
    fixtures/
      no-cover.mp3
      with-cover.mp3
  src/
    lib.rs               ← #[cfg(test)] module added here
```

---

## Setup Steps

1. Install dev dependencies:
    ```
    pnpm add -D vitest @testing-library/vue @testing-library/user-event \
               @pinia/testing jsdom
    ```
2. Add `test` block to `vite.config.ts` setting `environment: 'jsdom'`,
   `globals: true`, and `setupFiles: ['src/test-setup.ts']`.
3. Create `src/test-setup.ts` with a global `vi.mock('@tauri-apps/api/core')`
   and stubs for all Tauri plugin modules used by the app.
4. Add `"test": "vitest"` and `"test:ui": "vitest --ui"` to `package.json`
   scripts.
5. Add two small fixture audio files to `src-tauri/tests/fixtures/` — one clean,
   one with embedded cover art (any public-domain or test file is fine).
6. Add `#[cfg(test)]` module at the bottom of `lib.rs` with the two Rust tests.
