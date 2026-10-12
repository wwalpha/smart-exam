import { describe, expect, it } from 'vitest';
import { ReviewNextTime } from '@/lib/reviewNextTime';

describe('ReviewNextTime', () => {
  it('keeps MATERIAL correct answers at 90 days even after four consecutive correct answers', () => {
    let currentCorrectCount = 0;
    for (let i = 0; i < 4; i += 1) {
      const computed = ReviewNextTime.compute({
        mode: 'MATERIAL', baseDateYmd: '2026-01-01', isCorrect: true, currentCorrectCount,
      });
      expect(computed.nextTime).toBe('2026-04-01');
      currentCorrectCount = computed.nextCorrectCount;
    }
  });

  it('keeps MATERIAL incorrect answers at 30 days and resets the streak', () => {
    expect(ReviewNextTime.compute({
      mode: 'MATERIAL', baseDateYmd: '2026-01-01', isCorrect: false, currentCorrectCount: 2,
    })).toEqual({ nextTime: '2026-01-31', nextCorrectCount: 0 });
  });

  it.each([
    [0, true, '2026-01-31', 1],
    [1, true, '2026-04-01', 2],
    [2, true, ReviewNextTime.EXCLUDED_NEXT_TIME, 3],
    [2, false, '2026-01-08', 0],
  ])('preserves KANJI streak %s and result %s', (currentCorrectCount, isCorrect, nextTime, nextCorrectCount) => {
    expect(ReviewNextTime.compute({
      mode: 'KANJI', baseDateYmd: '2026-01-01', isCorrect, currentCorrectCount,
    })).toEqual({ nextTime, nextCorrectCount });
  });
});
