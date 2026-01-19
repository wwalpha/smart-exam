import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { SubmitReviewTestResultsRequest } from '@smart-exam/api-types';
import { ReviewTestsService } from '@/services';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const submitReviewTestResults = async (testId: string, req: SubmitReviewTestResultsRequest): Promise<boolean> => {
  const test = await ReviewTestsService.get(testId);
  if (!test) return false;

  const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();

  const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));

  await ReviewTestsService.put({
    ...test,
    submittedDate: dateYmd,
    results: nextResults,
  });

  const resultByTargetId = new Map(req.results.map((r) => [r.id, r.isCorrect] as const));

  await Promise.all(
    test.questions.map(async (targetId) => {
      const isCorrect = resultByTargetId.get(targetId);

      const open = await ReviewTestCandidatesService.getLatestOpenCandidateByTargetId({
        subject: test.subject,
        targetId,
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
            questionId: targetId,
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
