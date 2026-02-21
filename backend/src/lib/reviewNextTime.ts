import { DateUtils } from '@/lib/dateUtils';
import type { ExamMode } from '@smart-exam/api-types';

const EXCLUDED_NEXT_TIME = '2099-12-31';

export type { ExamMode };

export const ReviewNextTime = {
  EXCLUDED_NEXT_TIME,

  compute: (params: {
    mode: ExamMode;
    baseDateYmd: string;
    isCorrect: boolean;
    currentCorrectCount: number;
  }): { nextTime: string; nextCorrectCount: number } => {
    const current = Number.isFinite(params.currentCorrectCount) ? params.currentCorrectCount : 0;
    const maxStreak = params.mode === 'MATERIAL' ? 2 : 3;
    const currentClamped = Math.max(0, Math.min(maxStreak, Math.trunc(current)));

    if (params.isCorrect) {
      const nextCorrectCount = Math.min(maxStreak, currentClamped + 1);
      if (nextCorrectCount >= maxStreak) {
        return { nextTime: EXCLUDED_NEXT_TIME, nextCorrectCount };
      }

      if (params.mode === 'KANJI') {
        const addDays = nextCorrectCount === 1 ? 30 : 90;
        return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, addDays), nextCorrectCount };
      }

      // MATERIAL
      return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, 90), nextCorrectCount };
    }

    // incorrect
    const nextCorrectCount = 0;
    if (params.mode === 'KANJI') {
      return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, 7), nextCorrectCount };
    }

    // MATERIAL
    return { nextTime: DateUtils.addDaysYmd(params.baseDateYmd, 30), nextCorrectCount };
  },
};
