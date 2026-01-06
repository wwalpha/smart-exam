import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { SubmitReviewTestResultsRequest } from '@smart-exam/api-types';
import { ReviewTestsService } from '@/services';
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

  const candidateByTargetId = new Map<string, { correctCount: number }>();
  if (items.length > 0) {
    const uniqueTargets = Array.from(new Set(items.map((i) => i.targetId)));
    const candidates = await Promise.all(
      uniqueTargets.map((qid) => ReviewTestCandidatesService.getCandidate({ subject: test.subject, questionId: qid }))
    );
    uniqueTargets.forEach((qid, idx) => {
      const c = candidates[idx];
      candidateByTargetId.set(qid, { correctCount: typeof c?.correctCount === 'number' ? c.correctCount : 0 });
    });
  }

  await Promise.all(
    items.map(async (i) => {
      const isCorrect = resultByTargetId.get(i.targetId);

      try {
        if (typeof isCorrect === 'boolean') {
          const baseDateYmd = dateYmd;
          const currentCorrectCount = candidateByTargetId.get(i.targetId)?.correctCount ?? 0;
          const computed = ReviewNextTime.compute({
            mode: test.mode,
            baseDateYmd,
            isCorrect,
            currentCorrectCount,
          });

          await ReviewTestCandidatesService.updateNextTimeAndReleaseLockIfMatch({
            subject: test.subject,
            questionId: i.targetId,
            testId,
            nextTime: computed.nextTime,
            mode: test.mode,
            correctCount: computed.nextCorrectCount,
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
