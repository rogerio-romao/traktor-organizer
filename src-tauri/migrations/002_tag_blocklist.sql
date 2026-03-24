-- Tag blocklist: tokens to exclude when parsing Comments into tags
CREATE TABLE IF NOT EXISTS tag_blocklist (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_blocklist_name ON tag_blocklist(name);

-- Seed with known Beatport purchase receipt junk
INSERT OR IGNORE INTO tag_blocklist (name) VALUES ('purchased');
INSERT OR IGNORE INTO tag_blocklist (name) VALUES ('at');
INSERT OR IGNORE INTO tag_blocklist (name) VALUES ('beatportcom');
INSERT OR IGNORE INTO tag_blocklist (name) VALUES ('-');
