import { describe, it, expect } from 'vitest'
import { normalizeTag, splitCommentIntoTags } from '../../services/tag-processor'

describe('normalizeTag', () => {
  it('lowercases input', () => {
    expect(normalizeTag('HOUSE')).toBe('house')
    expect(normalizeTag('House')).toBe('house')
  })

  it('removes disallowed characters', () => {
    expect(normalizeTag('deep!house')).toBe('deephouse')
    expect(normalizeTag('deep#house')).toBe('deephouse')
    expect(normalizeTag('deep house')).toBe('deephouse')
    expect(normalizeTag('deep/house')).toBe('deephouse')
    expect(normalizeTag('deep&house')).toBe('deephouse')
  })

  it('preserves allowed characters: - @ .', () => {
    expect(normalizeTag('deep-house')).toBe('deep-house')
    expect(normalizeTag('user@example.com')).toBe('user@example.com')
    expect(normalizeTag('mix.vol1')).toBe('mix.vol1')
  })

  it('handles empty string', () => {
    expect(normalizeTag('')).toBe('')
  })

  it('handles only allowed characters', () => {
    expect(normalizeTag('house-techno.dj')).toBe('house-techno.dj')
  })
})

describe('splitCommentIntoTags', () => {
  it('splits on whitespace', () => {
    const result = splitCommentIntoTags('house techno dubstep')
    expect(result).toEqual(['house', 'techno', 'dubstep'])
  })

  it('deduplicates tags', () => {
    const result = splitCommentIntoTags('house house techno')
    expect(result).toEqual(['house', 'techno'])
  })

  it('applies blocklist and excludes blocked tags (case-insensitive)', () => {
    const blocklist = new Set(['bad', 'ugly'])
    const result = splitCommentIntoTags('good bad good ugly UGLY', blocklist)
    expect(result).toEqual(['good'])
  })

  it('applies normalization to all tags', () => {
    const result = splitCommentIntoTags('HOUSE TECHNO Deep-House')
    expect(result).toEqual(['house', 'techno', 'deep-house'])
  })

  it('returns empty array for empty input', () => {
    expect(splitCommentIntoTags('')).toEqual([])
    expect(splitCommentIntoTags('   ')).toEqual([])
    expect(splitCommentIntoTags('\t\n')).toEqual([])
  })

  it('filters out empty strings after normalization', () => {
    const result = splitCommentIntoTags('house   techno') // double space splits to empty
    expect(result).toEqual(['house', 'techno'])
  })

  it('filters blocklist entries', () => {
    const blocklist = new Set(['bad', 'ugly'])
    const result = splitCommentIntoTags('good bad good ugly', blocklist)
    expect(result).toEqual(['good'])
  })
})