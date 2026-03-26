import { describe, expect, it } from 'vitest';

import { nmlLocationToFilePath } from '@/utils/nml-path';

describe('nmlLocationToFilePath', () => {
    it('strips /: prefix and replaces with /', () => {
        const result = nmlLocationToFilePath(
            '/:Users/:dj/:Music/:Tracks/:',
            'track.mp3',
            'osx',
        );
        expect(result).toBe('/Users/dj/Music/Tracks/track.mp3');
    });

    it('handles simple path', () => {
        const result = nmlLocationToFilePath('/:path/:to/:', 'file.mp3', 'osx');
        expect(result).toBe('/path/to/file.mp3');
    });

    it('passes through Windows drive letter', () => {
        const result = nmlLocationToFilePath(
            '/:Music/:Tracks/:',
            'track.mp3',
            'C:',
        );
        expect(result).toBe('C:/Music/Tracks/track.mp3');
    });

    it('handles Windows drive without colon', () => {
        const result = nmlLocationToFilePath(
            '/:Music/:Tracks/:',
            'track.mp3',
            'D',
        );
        expect(result).toBe('D:/Music/Tracks/track.mp3');
    });

    it('treats osx volume as non-Windows', () => {
        const result = nmlLocationToFilePath(
            '/:path/:to/:',
            'track.mp3',
            'osx',
        );
        expect(result).toBe('/path/to/track.mp3');
    });

    it('handles trailing slash after replacement', () => {
        const result = nmlLocationToFilePath(
            '/:path/:to/:',
            'track.mp3',
            'osx',
        );
        expect(result).toBe('/path/to/track.mp3');
    });

    it('handles empty volume', () => {
        const result = nmlLocationToFilePath('/:path/:to/:', 'track.mp3', '');
        expect(result).toBe('/path/to/track.mp3');
    });
});
