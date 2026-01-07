import type { ReviewTestDetail } from '@smart-exam/api-types';
import { toApiReviewTest } from './internal';
import { ReviewTestsService } from '@/services';
import { QuestionsService } from '@/services/QuestionsService';
import { MaterialsService } from '@/services/MaterialsService';
import { WordMasterService } from '@/services/WordMasterService';

export const getReviewTest = async (testId: string): Promise<ReviewTestDetail | null> => {
  const test = await ReviewTestsService.get(testId);
  if (!test) return null;

  const resultByTargetId = new Map((test.results ?? []).map((r) => [r.id, r.isCorrect] as const));

  if (test.mode === 'KANJI') {
    const words = await Promise.all(test.questions.map((id) => WordMasterService.get(id)));
    const byId = new Map(words.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w.wordId, w] as const));

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
          kanji: w?.question,
          reading: w?.answer,
          questionText: w?.question,
          answerText: w?.answer,
          ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
        };
      }),
    };
  }

  const questionRows = await Promise.all(test.questions.map((qid) => QuestionsService.get(qid)));
  const qById = new Map(
    questionRows.filter((q): q is NonNullable<typeof q> => q !== null).map((q) => [q.questionId, q] as const)
  );

  const materialIds = Array.from(new Set(Array.from(qById.values()).map((q) => q.materialId)));
  const materialRows = await Promise.all(materialIds.map((mid) => MaterialsService.get(mid)));
  const mById = new Map(
    materialRows.filter((m): m is NonNullable<typeof m> => m !== null).map((m) => [m.materialId, m] as const)
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
