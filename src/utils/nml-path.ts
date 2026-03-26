/**
 * Convert Traktor NML LOCATION attributes to a standard OS file path.
 *
 * Traktor encodes directory paths using "/:" as separators:
 *   DIR = "/:Users/:dj/:Music/:Tracks/:"
 *   FILE = "track.mp3"
 *   → "/Users/dj/Music/Tracks/track.mp3"
 *
 * On Windows:
 *   VOLUME = "C:", DIR = "/:Music/:Tracks/:", FILE = "track.mp3"
 *   → "C:/Music/Tracks/track.mp3"
 */
export function nmlLocationToFilePath(dir: string, file: string, volume: string): string {
    // Replace all "/:" with "/" to get a normal path
    let osDir = dir.replaceAll('/:', '/');

    // Remove trailing slash if present
    if (osDir.endsWith('/')) {
        osDir = osDir.slice(0, -1);
    }

    // On Windows, prepend the drive letter (e.g., "C:")
    const isWindows = volume && volume !== 'osx' && /^[A-Za-z]:?$/.test(volume);
    if (isWindows) {
        const drive = volume.endsWith(':') ? volume : `${volume}:`;
        osDir = drive + osDir;
    }

    return `${osDir}/${file}`;
}
