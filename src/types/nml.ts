// TypeScript interfaces matching the structure produced by fast-xml-parser
// when parsing Traktor's collection.nml file.
// Attribute names are prefixed with @_ (fast-xml-parser convention).

export interface NmlCollection {
    NML: {
        '@_VERSION': string;
        COLLECTION: {
            '@_ENTRIES': string;
            ENTRY: NmlEntry[];
        };
        PLAYLISTS?: unknown;
    };
}

export interface NmlEntry {
    '@_TITLE': string;
    '@_ARTIST'?: string;
    '@_MODIFIED_DATE'?: string;
    '@_MODIFIED_TIME'?: string;
    '@_AUDIO_ID'?: string;
    LOCATION: NmlLocation;
    ALBUM?: {
        '@_TITLE'?: string;
        '@_TRACK'?: string;
    };
    INFO?: NmlInfo;
    TEMPO?: {
        '@_BPM'?: string;
        '@_BPM_QUALITY'?: string;
    };
    MUSICAL_KEY?: {
        '@_VALUE'?: string;
    };
    LOUDNESS?: {
        '@_PEAK_DB'?: string;
        '@_PERCEIVED_DB'?: string;
        '@_ANALYZED_DB'?: string;
    };
    CUE_V2?: NmlCue[];
}

export interface NmlLocation {
    '@_DIR': string; // "/:Users/:dj/:Music/:Tracks/:"
    '@_FILE': string; // "track.mp3"
    '@_VOLUME': string; // "osx" on macOS
    '@_VOLUMEID': string; // "osx" on macOS
}

export interface NmlInfo {
    '@_BITRATE'?: string;
    '@_GENRE'?: string;
    '@_COMMENT'?: string;
    '@_COVERARTID'?: string;
    '@_KEY'?: string; // Open Key text e.g. "10m"
    '@_KEY_LYRICS'?: string;
    '@_PLAYTIME'?: string; // Duration in seconds (integer)
    '@_PLAYTIME_FLOAT'?: string;
    '@_RANKING'?: string; // 0 | 51 | 102 | 153 | 204 | 255
    '@_IMPORT_DATE'?: string;
    '@_RELEASE_DATE'?: string;
    '@_FILESIZE'?: string;
    '@_LABEL'?: string;
    '@_REMIXER'?: string;
    '@_PRODUCER'?: string;
    '@_MIX'?: string;
    '@_CATALOG_NO'?: string;
    '@_PLAYCOUNT'?: string;
    '@_LAST_PLAYED'?: string;
    '@_FLAGS'?: string;
    '@_COLOR'?: string;
}

export interface NmlCue {
    '@_NAME'?: string;
    '@_TYPE'?: string;
    '@_START'?: string;
    '@_LEN'?: string;
    '@_HOTCUE'?: string;
}
