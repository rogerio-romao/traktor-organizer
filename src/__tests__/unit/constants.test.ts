import { describe, expect, it } from 'vitest';
import {
    formatDuration,
    rankingToStars,
    starsToRanking,
} from '@/utils/constants';

describe('rankingToStars / starsToRanking', () => {
    it('rankingToStars: 0→0, 51→1, 102→2, 153→3, 204→4, 255→5', () => {
        expect(rankingToStars(0)).toBe(0);
        expect(rankingToStars(51)).toBe(1);
        expect(rankingToStars(102)).toBe(2);
        expect(rankingToStars(153)).toBe(3);
        expect(rankingToStars(204)).toBe(4);
        expect(rankingToStars(255)).toBe(5);
    });

    it('rankingToStars: handles intermediate values', () => {
        expect(rankingToStars(25)).toBe(0); // rounds down
        expect(rankingToStars(76)).toBe(1); // rounds
    });

    it('starsToRanking: 0→0, 1→51, 2→102, 3→153, 4→204, 5→255', () => {
        expect(starsToRanking(0)).toBe(0);
        expect(starsToRanking(1)).toBe(51);
        expect(starsToRanking(2)).toBe(102);
        expect(starsToRanking(3)).toBe(153);
        expect(starsToRanking(4)).toBe(204);
        expect(starsToRanking(5)).toBe(255);
    });

    it('are inverses for all valid values', () => {
        for (let stars = 0; stars <= 5; stars++) {
            const ranking = starsToRanking(stars);
            expect(rankingToStars(ranking)).toBe(stars);
        }
    });
});

describe('formatDuration', () => {
    it('handles 0', () => {
        expect(formatDuration(0)).toBe('0:00');
    });

    it('handles negative values', () => {
        expect(formatDuration(-1)).toBe('0:00');
        expect(formatDuration(-100)).toBe('0:00');
    });

    it('formats mm:ss for under an hour', () => {
        expect(formatDuration(30)).toBe('0:30');
        expect(formatDuration(60)).toBe('1:00');
        expect(formatDuration(90)).toBe('1:30');
        expect(formatDuration(3599)).toBe('59:59');
    });

    it('formats h:mm:ss for an hour and over', () => {
        expect(formatDuration(3600)).toBe('1:00:00');
        expect(formatDuration(3661)).toBe('1:01:01');
        expect(formatDuration(7200)).toBe('2:00:00');
    });
});
