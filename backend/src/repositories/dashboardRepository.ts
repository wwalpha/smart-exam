import type { DashboardData } from '@smart-exam/api-types';
import { AttemptsService } from '@/services/AttemptsService';
import { QuestionsService } from '@/services/QuestionsService';
import { DateUtils } from '@/lib/dateUtils';

const toUtcDateKey = (iso: string): string => iso.slice(0, 10);

export const DashboardRepository = {
  getDashboardData: async (): Promise<DashboardData> => {
    const todayKey = toUtcDateKey(DateUtils.now());

    const attempts = await AttemptsService.scanAll();
    const todayTestCount = attempts.filter((a) =>
      a.startedAt ? toUtcDateKey(a.startedAt) === todayKey : false
    ).length;

    const questionStats = new Map<string, { total: number; incorrect: number }>();
    for (const attempt of attempts) {
      for (const r of attempt.results ?? []) {
        const stat = questionStats.get(r.questionId) ?? { total: 0, incorrect: 0 };
        stat.total += 1;
        if (!r.isCorrect) stat.incorrect += 1;
        questionStats.set(r.questionId, stat);
      }
    }

    const questions = await QuestionsService.scanAll();
    const questionById = new Map(questions.map((q) => [q.questionId, q] as const));

    const topIncorrectQuestions = Array.from(questionStats.entries())
      .filter(([, s]) => s.total > 0)
      .map(([questionId, s]) => {
        const incorrectRate = s.incorrect / s.total;
        const q = questionById.get(questionId);
        if (!q?.subjectId) return null;
        return {
          id: questionId,
          displayLabel: q.displayLabel ?? q.canonicalKey ?? questionId,
          incorrectRate,
          subject: q.subjectId,
        };
      })
      .filter((x) => x !== null)
      .sort((a, b) => b.incorrectRate - a.incorrectRate)
      .slice(0, 10);

    return {
      todayTestCount,
      topIncorrectQuestions,
      lockedCount: 0,
      inventoryCount: 0,
    };
  },
};
