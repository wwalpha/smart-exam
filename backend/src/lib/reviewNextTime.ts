import { DateUtils } from '@/lib/dateUtils';

const EXCLUDED_NEXT_TIME = '2099-12-31';

export type ReviewMode = 'QUESTION' | 'KANJI';

export const ReviewNextTime = {
  EXCLUDED_NEXT_TIME,

  compute: (params: {
    mode: ReviewMode;
    baseDateYmd: string;
    isCorrect: boolean;
    currentCorrectCount: number;
  }): { nextTime: string; nextCorrectCount: number } => {
    const current = Number.isFinite(params.currentCorrectCount) ? params.currentCorrectCount : 0;
    const currentClamped = Math.max(0, Math.min(3, Math.trunc(current)));

    if (params.isCorrect) {
      const nextCorrectCount = Math.min(3, currentClamped + 1);
      if (nextCorrectCount >= 3) {
        return { nextTime: EXCLUDED_NEXT_TIME, nextCorrectCount };
      }

      if (params.mode === 'KANJI') {
        const addDays = nextCorrectCount === 1 ? 30 : 90;
        return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, addDays), nextCorrectCount };
      }

      // QUESTION
      return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, 90), nextCorrectCount };
    }

    // incorrect
    const nextCorrectCount = 0;
    if (params.mode === 'KANJI') {
      return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, 1), nextCorrectCount };
    }

    // QUESTION
    return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, 30), nextCorrectCount };
  },
};
