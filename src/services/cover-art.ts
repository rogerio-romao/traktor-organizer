import { invoke } from '@tauri-apps/api/core';

// In-memory cache: file path → data URL (or empty string if no art found)
const cache = new Map<string, string>();

/**
 * Extract embedded cover art from an audio file.
 * Returns a base64 data URL suitable for use in an <img> src, or null if none found.
 * Results are cached in memory for the lifetime of the app session.
 */
export async function extractCoverArt(
    filePath: string,
): Promise<string | null> {
    if (cache.has(filePath)) {
        const cached = cache.get(filePath);
        return cached ?? null;
    }

    try {
        const base64: string = await invoke('extract_cover_art', {
            path: filePath,
        });
        const dataUrl = base64 ? `data:image/jpeg;base64,${base64}` : '';
        cache.set(filePath, dataUrl);
        return dataUrl || null;
    } catch {
        cache.set(filePath, '');
        return null;
    }
}
