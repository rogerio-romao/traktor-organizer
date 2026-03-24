use lofty::prelude::*;
use lofty::probe::Probe;
use tauri_plugin_sql::{Migration, MigrationKind};

/// Extract embedded cover art from an audio file.
/// Returns base64-encoded image data, or an empty string if none found.
#[tauri::command]
fn extract_cover_art(path: String) -> String {
    let Ok(tagged_file) = Probe::open(&path)
        .and_then(|p| p.read())
    else {
        return String::new();
    };

    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());

    tag.and_then(|t| t.pictures().first())
        .map(|pic| {
            use base64::Engine;
            base64::engine::general_purpose::STANDARD.encode(pic.data())
        })
        .unwrap_or_default()
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
        .invoke_handler(tauri::generate_handler![extract_cover_art])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
