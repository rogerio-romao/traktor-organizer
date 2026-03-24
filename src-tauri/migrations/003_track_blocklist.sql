-- Track blocklist: artists whose tracks are imported (for NML round-trip) but hidden in the UI
CREATE TABLE IF NOT EXISTS track_blocklist (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_name TEXT NOT NULL UNIQUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_track_blocklist_artist ON track_blocklist(artist_name);

-- Seed with Native Instruments (factory sounds/loops shipped with Traktor)
INSERT OR IGNORE INTO track_blocklist (artist_name) VALUES ('Native Instruments');
