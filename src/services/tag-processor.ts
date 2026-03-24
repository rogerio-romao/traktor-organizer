/**
 * Split a Traktor Comments field into individual normalized tags.
 *
 * Rules:
 * - Split on whitespace
 * - Normalize to lowercase
 * - Strip characters that are not alphanumeric or hyphen
 * - Hyphens connect multi-word tags (e.g. "peak-time")
 * - Deduplicate
 * - Drop empty strings
 */
export function splitCommentIntoTags(comment: string, blocklist: Set<string> = new Set()): string[] {
  if (!comment?.trim()) return []

  return [...new Set(
    comment
      .trim()
      .split(/\s+/)
      .map(t => t.toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(t => t.length > 0 && !blocklist.has(t)),
  )]
}
