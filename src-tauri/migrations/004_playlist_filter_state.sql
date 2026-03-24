-- Store the filter state that was active when a playlist was saved.
-- Used to detect drift: re-running these filters against the current collection
-- and comparing the resulting track ID set against what's saved in playlist_tracks.
ALTER TABLE playlists ADD COLUMN filter_state TEXT DEFAULT NULL;
