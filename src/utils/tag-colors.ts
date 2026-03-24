const STORAGE_KEY = 'traktor-tag-colors'

let cache: Record<string, { bg: string; text: string }> | null = null

function load(): Record<string, { bg: string; text: string }> {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache = raw ? JSON.parse(raw) : {}
  } catch {
    cache = {}
  }
  return cache!
}

function save(colors: Record<string, { bg: string; text: string }>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {}
}

function generateColor(): { bg: string; text: string } {
  const hue = Math.floor(Math.random() * 360)
  return {
    bg: `hsl(${hue}, 55%, 20%)`,
    text: `hsl(${hue}, 80%, 72%)`,
  }
}

export function getTagColor(tag: string): { bg: string; text: string } {
  const colors = load()
  if (!colors[tag]) {
    colors[tag] = generateColor()
    save(colors)
  }
  return colors[tag]
}
