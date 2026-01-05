import type { DashboardData } from '@smart-exam/api-types';
import { AttemptsService } from '@/services/AttemptsService';
import { QuestionsService } from '@/services/QuestionsService';
import { DateUtils } from '@/lib/dateUtils';
import { WordsService } from '@/services/WordsService';
import { WordIncorrectRepository } from '@/repositories';

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
        return {
          id: questionId,
          displayLabel: q?.displayLabel ?? q?.canonicalKey ?? questionId,
          incorrectRate,
          subject: q?.subjectId ?? '',
        };
      })
      .sort((a, b) => b.incorrectRate - a.incorrectRate)
      .slice(0, 10);

    const recentIncorrects = await WordIncorrectRepository.listRecentIncorrects(10);
    const wordById = new Map(
      (
        await Promise.all(
          recentIncorrects.map(async (x) => {
            const w = await WordsService.get(x.wordId);
            return w ? ([x.wordId, w] as const) : null;
          })
        )
      ).filter((x): x is readonly [string, NonNullable<Awaited<ReturnType<typeof WordsService.get>>>] => x !== null)
    );

    const topIncorrectKanji = recentIncorrects
      .map((x) => {
        const w = wordById.get(x.wordId);
        if (!w) return null;
        return {
          id: x.wordId,
          kanji: w.question,
          subject: x.subject,
          lastIncorrectAt: x.lastIncorrectAt,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return {
      todayTestCount,
      topIncorrectQuestions,
      topIncorrectKanji,
      lockedCount: 0,
      inventoryCount: 0,
    };
  },
};
