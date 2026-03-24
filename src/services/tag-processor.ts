/** Normalize a single tag: lowercase, strip disallowed characters. */
export function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9@.-]/g, '')
}

/**
 * Split a Traktor Comments field into individual normalized tags.
 *
 * Rules:
 * - Split on whitespace
 * - Normalize to lowercase
 * - Strip characters that are not alphanumeric, hyphen, @, or dot
 * - Hyphens connect multi-word tags (e.g. "peak-time"), @ and . preserved for emails etc.
 * - Deduplicate
 * - Drop empty strings
 */
export function splitCommentIntoTags(comment: string, blocklist: Set<string> = new Set()): string[] {
  if (!comment?.trim()) return []

  return [...new Set(
    comment
      .trim()
      .split(/\s+/)
      .map(t => normalizeTag(t))
      .filter(t => t.length > 0 && !blocklist.has(t)),
  )]
}
