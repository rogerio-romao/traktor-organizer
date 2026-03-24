import Database from '@tauri-apps/plugin-sql'

const DB_URL = 'sqlite:traktor-organizer.db'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load(DB_URL)
  }
  return db
}

export async function getTagBlocklist(): Promise<Set<string>> {
  const database = await getDb()
  const rows = await database.select<{ name: string }[]>('SELECT name FROM tag_blocklist')
  return new Set(rows.map(r => r.name))
}

export async function runStartupMaintenance(): Promise<void> {
  const database = await getDb()
  const rows = await database.select<{ name: string }[]>('SELECT name FROM tag_blocklist')
  const names = rows.map(r => r.name)
  if (names.length === 0) return
  // tauri-plugin-sql uses positional params ($1, $2, ...), so we build one placeholder
  // per blocklist entry. e.g. 4 entries → "IN ($1,$2,$3,$4)" with names as the params array.
  const placeholders = names.map((_, i) => `$${i + 1}`).join(',')
  await database.execute(
    `DELETE FROM track_tags WHERE tag_id IN (SELECT id FROM tags WHERE name IN (${placeholders}))`,
    names,
  )
  await database.execute(
    `DELETE FROM tags WHERE name IN (${placeholders})`,
    names,
  )
}

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDb()
  const rows = await database.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [key],
  )
  return rows[0]?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDb()
  await database.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [key, value],
  )
}
