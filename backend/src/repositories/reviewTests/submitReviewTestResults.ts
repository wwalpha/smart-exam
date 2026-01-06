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

  await Promise.all(
    items.map(async (i) => {
      const isCorrect = resultByTargetId.get(i.targetId);

      const open = await ReviewTestCandidatesService.getLatestOpenCandidateByTargetId({
        subject: test.subject,
        targetId: i.targetId,
      });

      try {
        if (typeof isCorrect === 'boolean') {
          const baseDateYmd = dateYmd;
          const currentCorrectCount = open ? open.correctCount : 0;
          const computed = ReviewNextTime.compute({
            mode: test.mode,
            baseDateYmd,
            isCorrect,
            currentCorrectCount,
          });

          if (open) {
            await ReviewTestCandidatesService.closeCandidateIfMatch({
              subject: test.subject,
              candidateKey: open.candidateKey,
              expectedTestId: testId,
            });
          }

          await ReviewTestCandidatesService.createCandidate({
            subject: test.subject,
            questionId: i.targetId,
            mode: test.mode,
            nextTime: computed.nextTime,
            correctCount: computed.nextCorrectCount,
            status: computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'OPEN',
          });
          return;
        }

        if (open && open.testId === testId) {
          await ReviewTestCandidatesService.releaseLockIfMatch({
            subject: test.subject,
            candidateKey: open.candidateKey,
            testId,
          });
        }
      } catch (e: unknown) {
        const name = (e as { name?: string } | null)?.name;
        if (name === 'ConditionalCheckFailedException') return;
        throw e;
      }
    })
  );

  return true;
};
