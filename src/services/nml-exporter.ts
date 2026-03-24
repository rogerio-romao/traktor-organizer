import type { TrackRow } from '../types/track'

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Build an XML attribute string, omitting the attribute if value is null/undefined/empty string.
// Zero is a valid value and is included.
function attr(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  return ` ${name}="${escapeXml(String(value))}"`
}

function ratingToRanking(rating: number): number {
  // Traktor ranking: 0=none, 51=1★, 102=2★, 153=3★, 204=4★, 255=5★
  return rating * 51
}

function todayNml(): string {
  const d = new Date()
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function secondsSinceMidnight(): number {
  const d = new Date()
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
}

export function buildPlaylistNml(playlistName: string, tracks: TrackRow[]): string {
  const today = todayNml()
  const time  = secondsSinceMidnight()
  const uuid  = crypto.randomUUID()

  const collectionEntries = tracks.map(t => {
    const ranking   = ratingToRanking(t.rating)
    const bpmStr    = t.bpm != null ? t.bpm.toFixed(6) : null
    const bpmQual   = t.bpmQuality != null ? t.bpmQuality.toFixed(1) : null
    const playcount = t.playCount > 0 ? t.playCount : null

    const tempo = bpmStr
      ? `\n    <TEMPO${attr('BPM', bpmStr)}${attr('BPM_QUALITY', bpmQual)}></TEMPO>`
      : ''

    const musicalKey = t.musicalKeyValue != null
      ? `\n    <MUSICAL_KEY${attr('VALUE', t.musicalKeyValue)}></MUSICAL_KEY>`
      : ''

    const loudness = (t.loudnessPeak != null || t.loudnessPerceived != null || t.loudnessAnalyzed != null)
      ? `\n    <LOUDNESS${attr('PEAK_DB', t.loudnessPeak)}${attr('PERCEIVED_DB', t.loudnessPerceived)}${attr('ANALYZED_DB', t.loudnessAnalyzed)}></LOUDNESS>`
      : ''

    return `<ENTRY${attr('MODIFIED_DATE', today)}${attr('MODIFIED_TIME', time)}${attr('AUDIO_ID', t.audioId)}${attr('TITLE', t.title)}${attr('ARTIST', t.artist)}>
    <LOCATION${attr('DIR', t.nmlDir)}${attr('FILE', t.nmlFile)}${attr('VOLUME', t.nmlVolume)}${attr('VOLUMEID', t.nmlVolumeId)}></LOCATION>
    <MODIFICATION_INFO AUTHOR_TYPE="user"></MODIFICATION_INFO>
    <INFO${attr('BITRATE', t.bitrate)}${attr('GENRE', t.genre)}${attr('COMMENT', t.tags.length ? t.tags.join(' ') : t.commentRaw)}${attr('COVERARTID', t.coverArtId)}${attr('KEY', t.musicalKey)}${attr('KEY_LYRICS', t.keyLyrics)}${attr('PLAYTIME', t.duration)}${attr('PLAYTIME_FLOAT', t.durationFloat)}${attr('RANKING', ranking)}${attr('IMPORT_DATE', t.importDate)}${attr('RELEASE_DATE', t.releaseDate)}${attr('FILESIZE', t.filesize)}${attr('LABEL', t.label)}${attr('REMIXER', t.remixer)}${attr('PRODUCER', t.producer)}${attr('MIX', t.mix)}${attr('CATALOG_NO', t.catalogNo)}${attr('PLAYCOUNT', playcount)}${attr('LAST_PLAYED', t.lastPlayed)}${attr('FLAGS', t.flags)}${attr('COLOR', t.color)}></INFO>${tempo}${musicalKey}${loudness}
</ENTRY>`
  }).join('\n')

  const playlistEntries = tracks.map(t =>
    `<ENTRY><PRIMARYKEY TYPE="TRACK" KEY="${escapeXml(t.nmlVolume + t.nmlDir + t.nmlFile)}"></PRIMARYKEY>\n</ENTRY>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<NML VERSION="19"><HEAD COMPANY="www.native-instruments.com" PROGRAM="Traktor"></HEAD>
<COLLECTION ENTRIES="${tracks.length}">${collectionEntries}
</COLLECTION>
<SETS ENTRIES="0"></SETS>
<PLAYLISTS><NODE TYPE="FOLDER" NAME="$ROOT"><SUBNODES COUNT="1"><NODE TYPE="PLAYLIST" NAME="${escapeXml(playlistName)}"><PLAYLIST ENTRIES="${tracks.length}" TYPE="LIST" UUID="${uuid}">${playlistEntries}
</PLAYLIST>
</NODE>
</SUBNODES>
</NODE>
</PLAYLISTS>
<INDEXING></INDEXING>
</NML>`
}
