const STORAGE_KEY = 'traktor-tag-colors'

interface TagColor { bg: string; border: string }

let cache: Record<string, TagColor> | null = null

function load(): Record<string, TagColor> {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache = raw ? JSON.parse(raw) : {}
  } catch {
    cache = {}
  }
  return cache!
}

function save(colors: Record<string, TagColor>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {}
}

function generateColor(): TagColor {
  const hue = Math.floor(Math.random() * 360)
  return {
    bg: `hsl(${hue}, 45%, 14%)`,
    border: `hsl(${hue}, 55%, 32%)`,
  }
}

export function getTagColor(tag: string): TagColor {
  const colors = load()
  // Re-generate if missing or cached from old format (had a text field)
  if (!colors[tag] || !colors[tag].border) {
    colors[tag] = generateColor()
    save(colors)
  }
  return colors[tag]
}
