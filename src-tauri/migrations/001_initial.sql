-- Tracks: all metadata from NML import
CREATE TABLE IF NOT EXISTS tracks (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Visible fields
    title               TEXT NOT NULL DEFAULT '',
    artist              TEXT NOT NULL DEFAULT '',
    album               TEXT NOT NULL DEFAULT '',
    genre               TEXT NOT NULL DEFAULT '',           -- EDITABLE
    bpm                 REAL,
    musical_key         TEXT NOT NULL DEFAULT '',           -- Display string e.g. "1m", "5d"
    musical_key_value   INTEGER,                            -- Raw MUSICAL_KEY VALUE (0-23)
    duration            INTEGER NOT NULL DEFAULT 0,         -- Seconds
    duration_float      REAL,                               -- PLAYTIME_FLOAT for precision
    rating              INTEGER NOT NULL DEFAULT 0,         -- 0-5 stars (EDITABLE)
    label               TEXT NOT NULL DEFAULT '',
    remixer             TEXT NOT NULL DEFAULT '',
    producer            TEXT NOT NULL DEFAULT '',
    release_date        TEXT NOT NULL DEFAULT '',
    -- Hidden fields (not shown in UI, preserved for round-trip NML export)
    mix                 TEXT NOT NULL DEFAULT '',
    catalog_no          TEXT NOT NULL DEFAULT '',
    bitrate             INTEGER,
    filesize            INTEGER,
    play_count          INTEGER NOT NULL DEFAULT 0,
    last_played         TEXT NOT NULL DEFAULT '',
    color               INTEGER,
    loudness_peak       REAL,
    loudness_perceived  REAL,
    loudness_analyzed   REAL,
    bpm_quality         REAL,
    key_lyrics          TEXT NOT NULL DEFAULT '',
    flags               INTEGER,
    -- File location (raw NML LOCATION attributes preserved for export)
    file_path           TEXT NOT NULL UNIQUE,               -- Full OS path (merge key for re-import)
    file_name           TEXT NOT NULL DEFAULT '',
    nml_dir             TEXT NOT NULL DEFAULT '',
    nml_file            TEXT NOT NULL DEFAULT '',
    nml_volume          TEXT NOT NULL DEFAULT '',
    nml_volume_id       TEXT NOT NULL DEFAULT '',
    -- Other metadata
    cover_art_id        TEXT NOT NULL DEFAULT '',
    comment_raw         TEXT NOT NULL DEFAULT '',           -- Original COMMENT preserved
    import_date         TEXT NOT NULL DEFAULT '',           -- NML IMPORT_DATE
    app_import_date     TEXT NOT NULL DEFAULT '',           -- When imported into this app
    audio_id            TEXT NOT NULL DEFAULT '',
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tracks_file_path ON tracks(file_path);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_bpm ON tracks(bpm);
CREATE INDEX IF NOT EXISTS idx_tracks_key ON tracks(musical_key);
CREATE INDEX IF NOT EXISTS idx_tracks_rating ON tracks(rating);

-- Tags: unique normalized tag strings (lowercase, hyphens for multi-word)
CREATE TABLE IF NOT EXISTS tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Track-tags: many-to-many junction
CREATE TABLE IF NOT EXISTS track_tags (
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_track_tags_tag_id ON track_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_track_tags_track_id ON track_tags(track_id);

-- Playlists: generated playlists from tag filtering
CREATE TABLE IF NOT EXISTS playlists (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Playlist tracks: ordered track references per playlist
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);

-- App settings: key-value store for user preferences
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('key_display_format', 'open_key');
