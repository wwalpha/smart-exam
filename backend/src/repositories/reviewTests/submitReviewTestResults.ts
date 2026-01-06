import { DateUtils } from '@/lib/dateUtils';
import type { SubmitReviewTestResultsRequest } from '@smart-exam/api-types';
import { MaterialsService } from '@/services/MaterialsService';
import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestsService } from '@/services/ReviewTestsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const submitReviewTestResults = async (testId: string, req: SubmitReviewTestResultsRequest): Promise<boolean> => {
  const test = await ReviewTestsService.get(testId);
  if (!test) return false;

  const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();

  const resultById = new Map(req.results.map((r) => [r.id, r.isCorrect] as const));

  const nextItems = (test.items ?? []).map((i) => {
    const isCorrect = resultById.get(i.targetId);
    return isCorrect === undefined ? i : { ...i, isCorrect };
  });

  const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));

  await ReviewTestsService.put({
    ...test,
    items: nextItems,
    submittedDate: dateYmd,
    results: nextResults,
  });

  const items = Array.isArray(test.items) ? test.items : [];
  const resultByTargetId = new Map(req.results.map((r) => [r.id, r.isCorrect] as const));

  const performedDateYmdByQuestionId = new Map<string, string>();
  if (test.mode === 'QUESTION' && items.length > 0) {
    const questionIds = Array.from(new Set(items.map((i) => i.targetId)));
    const questions = await Promise.all(questionIds.map((qid) => QuestionsService.get(qid)));
    const byId = new Map(questions.filter((q): q is NonNullable<typeof q> => q !== null).map((q) => [q.questionId, q] as const));

    const materialIds = Array.from(new Set(Array.from(byId.values()).map((q) => q.materialId)));
    const materials = await Promise.all(materialIds.map((mid) => MaterialsService.get(mid)));
    const materialById = new Map(materials.filter((m): m is NonNullable<typeof m> => m !== null).map((m) => [m.materialId, m] as const));

    for (const qid of questionIds) {
      const q = byId.get(qid);
      const m = q ? materialById.get(q.materialId) : null;

      const raw = (m?.executionDate ?? (m as any)?.date ?? (m as any)?.yearMonth)?.trim();
      const performed = (() => {
        if (!raw) return dateYmd;
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
        if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
        return dateYmd;
      })();

      performedDateYmdByQuestionId.set(qid, performed);
    }
  }

  await Promise.all(
    items.map(async (i) => {
      const isCorrect = resultByTargetId.get(i.targetId);

      try {
        if (isCorrect === true) {
          await ReviewTestCandidatesService.deleteIfLocked({ subject: test.subject, questionId: i.targetId, testId });
          return;
        }

        if (isCorrect === false) {
          const performed = performedDateYmdByQuestionId.get(i.targetId) ?? dateYmd;
          const nextTime = DateUtils.addDaysYmd(performed, 1);

          await ReviewTestCandidatesService.updateNextTimeAndReleaseLockIfMatch({
            subject: test.subject,
            questionId: i.targetId,
            testId,
            nextTime,
            mode: test.mode,
          });
          return;
        }

        await ReviewTestCandidatesService.releaseLockIfMatch({ subject: test.subject, questionId: i.targetId, testId });
      } catch (e: unknown) {
        const name = (e as { name?: string } | null)?.name;
        if (name === 'ConditionalCheckFailedException') return;
        throw e;
      }
    })
  );

  return true;
};
