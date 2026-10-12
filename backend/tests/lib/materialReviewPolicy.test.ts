import { describe, expect, it } from 'vitest';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { requireMaterialReviewCount } from '@/lib/materialReviewPolicy';
import type { MaterialQuestionsTable } from '@/types/db';

describe('review policy', () => {
  it('keeps MATERIAL intervals without streak exclusion', () => {
    for (let streak = 0; streak < 6; streak++) {
      expect(ReviewNextTime.compute({ mode: 'MATERIAL', baseDateYmd: '2026-01-01', isCorrect: true, currentCorrectCount: streak })).toEqual({ nextTime: '2026-04-01', nextCorrectCount: streak + 1 });
      expect(ReviewNextTime.compute({ mode: 'MATERIAL', baseDateYmd: '2026-01-01', isCorrect: false, currentCorrectCount: streak })).toEqual({ nextTime: '2026-01-31', nextCorrectCount: 0 });
    }
  });
  it('retains KANJI 7/30/90 days and third-correct exclusion', () => {
    const compute = (streak: number, correct: boolean) => ReviewNextTime.compute({ mode: 'KANJI', baseDateYmd: '2026-01-01', isCorrect: correct, currentCorrectCount: streak });
    expect(compute(0, true)).toEqual({ nextTime: '2026-01-31', nextCorrectCount: 1 });
    expect(compute(1, true)).toEqual({ nextTime: '2026-04-01', nextCorrectCount: 2 });
    expect(compute(2, true)).toEqual({ nextTime: '2099-12-31', nextCorrectCount: 3 });
    expect(compute(2, false)).toEqual({ nextTime: '2026-01-08', nextCorrectCount: 0 });
  });
  it('rejects unknown initialization and corrupt ledgers', () => {
    const q = {} as MaterialQuestionsTable;
    expect(() => requireMaterialReviewCount(q)).toThrow();
    expect(() => requireMaterialReviewCount({ ...q, reviewCount: 4, reviewPolicyVersion: 2 })).toThrow();
    expect(requireMaterialReviewCount({ ...q, reviewCount: 0, reviewPolicyVersion: 2 })).toBe(0);
  });
});
