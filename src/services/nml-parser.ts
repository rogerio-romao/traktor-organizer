import { XMLParser } from 'fast-xml-parser';

import { MUSICAL_KEY_VALUE_TO_OPEN_KEY, rankingToStars } from '@/utils/constants';
import { nmlLocationToFilePath } from '@/utils/nml-path';

import type { NmlCollection, NmlEntry } from '@/types/nml';

const parser = new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    isArray: (name): boolean => ['ENTRY', 'CUE_V2', 'NODE'].includes(name),
    parseAttributeValue: false, // Keep everything as strings; we parse manually
    processEntities: false, // Disable to avoid expansion limit on large collections
    trimValues: true,
});

// Decode the standard XML entities that Traktor uses in track names/metadata
function decodeEntities(str: string | undefined): string {
    if (!str) return '';
    return str
        .replaceAll('&apos;', "'")
        .replaceAll('&quot;', '"')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&amp;', '&');
}

// The shape of a parsed track ready for database insertion
export interface ParsedTrack {
    // Visible fields
    title: string;
    artist: string;
    album: string;
    genre: string;
    bpm: number | null;
    musicalKey: string; // Open Key text e.g. "10m"
    musicalKeyValue: number | null;
    duration: number; // Seconds (integer)
    durationFloat: number | null;
    rating: number; // 0–5 stars
    label: string;
    remixer: string;
    producer: string;
    releaseDate: string;
    // Hidden fields (preserved for round-trip NML export)
    mix: string;
    catalogNo: string;
    bitrate: number | null;
    filesize: number | null;
    playCount: number;
    lastPlayed: string;
    color: number | null;
    loudnessPeak: number | null;
    loudnessPerceived: number | null;
    loudnessAnalyzed: number | null;
    bpmQuality: number | null;
    keyLyrics: string;
    flags: number | null;
    // File location
    filePath: string; // Full OS path (merge key)
    fileName: string;
    nmlDir: string;
    nmlFile: string;
    nmlVolume: string;
    nmlVolumeId: string;
    // Other
    coverArtId: string;
    commentRaw: string;
    importDate: string;
    audioId: string;
}

/**
 * Parse the XML content of a Traktor collection.nml file.
 * Returns an array of ParsedTrack objects ready for database insertion.
 * Invalid entries (missing LOCATION or file path) are skipped.
 */
// oxlint-disable-next-line complexity, max-statements, max-lines-per-function
export function parseNmlCollection(xmlContent: string): ParsedTrack[] {
    // Strip UTF-8 BOM if present
    const xml = xmlContent.codePointAt(0) === 0xfe_ff ? xmlContent.slice(1) : xmlContent;

    const raw = parser.parse(xml) as NmlCollection;

    const entries: NmlEntry[] = raw?.NML?.COLLECTION?.ENTRY ?? [];

    const tracks: ParsedTrack[] = [];

    for (const entry of entries) {
        const loc = entry.LOCATION;
        if (!loc?.['@_FILE'] || !loc?.['@_DIR']) continue;

        const filePath = nmlLocationToFilePath(loc['@_DIR'], loc['@_FILE'], loc['@_VOLUME'] ?? '');
        if (!filePath) continue;

        const info = entry.INFO ?? {};
        const tempo = entry.TEMPO ?? {};
        const loudness = entry.LOUDNESS ?? {};
        const musicalKeyRaw = entry.MUSICAL_KEY?.['@_VALUE'];
        const musicalKeyValue =
            musicalKeyRaw === undefined ? null : Number.parseInt(musicalKeyRaw, 10);

        // Prefer the text key from INFO (already in Open Key format like "10m")
        // Fall back to converting the numeric MUSICAL_KEY value
        let musicalKey = info['@_KEY'] ?? '';
        if (musicalKey) {
            // keep key from INFO
        } else if (musicalKeyValue !== null) {
            musicalKey = MUSICAL_KEY_VALUE_TO_OPEN_KEY[musicalKeyValue] ?? '';
        }

        const ranking = Number.parseInt(info['@_RANKING'] ?? '0', 10);

        tracks.push({
            album: decodeEntities(entry.ALBUM?.['@_TITLE']),
            artist: decodeEntities(entry['@_ARTIST']),
            audioId: entry['@_AUDIO_ID'] ?? '',
            bitrate: info['@_BITRATE'] ? Number.parseInt(info['@_BITRATE'], 10) : null,
            bpm: tempo['@_BPM'] ? Number.parseFloat(tempo['@_BPM']) : null,
            bpmQuality: tempo['@_BPM_QUALITY'] ? Number.parseFloat(tempo['@_BPM_QUALITY']) : null,
            catalogNo: info['@_CATALOG_NO'] ?? '',
            color: info['@_COLOR'] ? Number.parseInt(info['@_COLOR'], 10) : null,
            commentRaw: decodeEntities(info['@_COMMENT']),
            coverArtId: info['@_COVERARTID'] ?? '',
            duration: Number.parseInt(info['@_PLAYTIME'] ?? '0', 10),
            durationFloat: info['@_PLAYTIME_FLOAT']
                ? Number.parseFloat(info['@_PLAYTIME_FLOAT'])
                : null,
            fileName: loc['@_FILE'],
            filePath,
            filesize: info['@_FILESIZE'] ? Number.parseInt(info['@_FILESIZE'], 10) : null,
            flags: info['@_FLAGS'] ? Number.parseInt(info['@_FLAGS'], 10) : null,
            genre: decodeEntities(info['@_GENRE']),
            importDate: info['@_IMPORT_DATE'] ?? '',
            keyLyrics: info['@_KEY_LYRICS'] ?? '',
            label: decodeEntities(info['@_LABEL']),
            lastPlayed: info['@_LAST_PLAYED'] ?? '',
            loudnessAnalyzed: loudness['@_ANALYZED_DB']
                ? Number.parseFloat(loudness['@_ANALYZED_DB'])
                : null,
            loudnessPeak: loudness['@_PEAK_DB'] ? Number.parseFloat(loudness['@_PEAK_DB']) : null,
            loudnessPerceived: loudness['@_PERCEIVED_DB']
                ? Number.parseFloat(loudness['@_PERCEIVED_DB'])
                : null,
            mix: decodeEntities(info['@_MIX']),
            musicalKey,
            musicalKeyValue: Number.isNaN(musicalKeyValue ?? Number.NaN) ? null : musicalKeyValue,
            nmlDir: loc['@_DIR'],
            nmlFile: loc['@_FILE'],
            nmlVolume: loc['@_VOLUME'] ?? '',
            nmlVolumeId: loc['@_VOLUMEID'] ?? '',
            playCount: info['@_PLAYCOUNT'] ? Number.parseInt(info['@_PLAYCOUNT'], 10) : 0,
            producer: decodeEntities(info['@_PRODUCER']),
            rating: Number.isNaN(ranking) ? 0 : rankingToStars(ranking),
            releaseDate: info['@_RELEASE_DATE'] ?? '',
            remixer: decodeEntities(info['@_REMIXER']),
            title: decodeEntities(entry['@_TITLE']),
        });
    }

    return tracks;
}
