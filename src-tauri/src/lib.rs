use lofty::config::ParseOptions;
use lofty::prelude::*;
use lofty::probe::Probe;
use tauri_plugin_sql::{Migration, MigrationKind};

/// Extract embedded cover art from an audio file.
/// Returns base64-encoded image data, or an empty string if none found.
#[tauri::command]
fn extract_cover_art(path: String) -> String {
    let Ok(tagged_file) = Probe::open(&path)
        .and_then(|p| p.options(ParseOptions::new().read_properties(false)).read())
    else {
        return String::new();
    };

    let tag = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag());

    tag.and_then(|t| t.pictures().first())
        .map(|pic| {
            use base64::Engine;
            base64::engine::general_purpose::STANDARD.encode(pic.data())
        })
        .unwrap_or_default()
}

#[tauri::command]
fn open_devtools(window: tauri::WebviewWindow) {
    #[cfg(debug_assertions)]
    window.open_devtools();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_tag_blocklist",
            sql: include_str!("../migrations/002_tag_blocklist.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_track_blocklist",
            sql: include_str!("../migrations/003_track_blocklist.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "playlist_filter_state",
            sql: include_str!("../migrations/004_playlist_filter_state.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:traktor-organizer.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![extract_cover_art, open_devtools])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::extract_cover_art;

    fn fixture(name: &str) -> String {
        format!("{}/tests/fixtures/{}", env!("CARGO_MANIFEST_DIR"), name)
    }

    #[test]
    fn no_cover_returns_empty_string() {
        assert!(extract_cover_art(fixture("no-cover.mp3")).is_empty());
    }

    #[test]
    fn with_cover_returns_base64_jpeg() {
        let result = extract_cover_art(fixture("with-cover.mp3"));
        assert!(!result.is_empty(), "expected non-empty base64 string");

        use base64::Engine;
        let decoded = base64::engine::general_purpose::STANDARD
            .decode(&result)
            .expect("result must be valid base64");

        assert!(
            decoded.starts_with(&[0xFF, 0xD8, 0xFF]),
            "decoded bytes must start with JPEG magic (FF D8 FF)"
        );
    }
}
