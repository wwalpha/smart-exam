import type { ReviewTestDetail } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { ReviewTestsService } from './createReviewTestsService';
import { toApiReviewTest } from './internal';

export const createGetReviewTest = (repositories: Repositories): ReviewTestsService['getReviewTest'] => {
  return async (testId): Promise<ReviewTestDetail | null> => {
    const test = await repositories.reviewTests.get(testId);
    if (!test) return null;

    const resultByTargetId = new Map((test.results ?? []).map((r) => [r.id, r.isCorrect] as const));

    if (test.mode === 'KANJI') {
      const words = await Promise.all(test.questions.map((id) => repositories.wordMaster.get(id)));
      const byId = new Map(
        words.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w.wordId, w] as const),
      );

      return {
        ...toApiReviewTest(test),
        items: test.questions.map((targetId) => {
          const w = byId.get(targetId);
          const isCorrect = resultByTargetId.get(targetId);
          return {
            id: targetId,
            itemId: targetId,
            testId,
            targetType: 'KANJI',
            targetId,
            kanji: w?.answer,
            reading: w?.readingHiragana,
            questionText: w?.question,
            answerText: w?.answer,
            readingHiragana: w?.readingHiragana,
            underlineSpec: w?.underlineSpec,
            ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
          };
        }),
      };
    }

    const questionRows = await Promise.all(test.questions.map((qid) => repositories.questions.get(qid)));
    const qById = new Map(
      questionRows.filter((q): q is NonNullable<typeof q> => q !== null).map((q) => [q.questionId, q] as const),
    );

    const materialIds = Array.from(new Set(Array.from(qById.values()).map((q) => q.materialId)));
    const materialRows = await Promise.all(materialIds.map((mid) => repositories.materials.get(mid)));
    const mById = new Map(
      materialRows.filter((m): m is NonNullable<typeof m> => m !== null).map((m) => [m.materialId, m] as const),
    );

    return {
      ...toApiReviewTest(test),
      items: test.questions.map((targetId) => {
        const q = qById.get(targetId);
        const m = q ? mById.get(q.materialId) : undefined;
        const isCorrect = resultByTargetId.get(targetId);

        return {
          id: targetId,
          itemId: targetId,
          testId,
          targetType: 'QUESTION',
          targetId,
          displayLabel: q?.canonicalKey,
          canonicalKey: q?.canonicalKey,
          materialId: q?.materialId,
          grade: m?.grade,
          provider: m?.provider,
          materialName: m?.title,
          materialDate: m?.materialDate,
          questionText: q?.canonicalKey,
          ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
        };
      }),
    };
  };
};
