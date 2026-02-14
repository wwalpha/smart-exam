import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './createExamsService';

export const createSubmitExamResults = (
  repositories: Repositories,
): ExamsService['submitExamResults'] => {
  return async (testId, req): Promise<boolean> => {
    const test = await repositories.exams.get(testId);
    if (!test) return false;

    const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();

    const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));

    await repositories.exams.put({
      ...test,
      submittedDate: dateYmd,
      results: nextResults,
    });

    const resultByTargetId = new Map(req.results.map((r) => [r.id, r.isCorrect] as const));

    await Promise.all(
      test.questions.map(async (targetId) => {
        const isCorrect = resultByTargetId.get(targetId);

        const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
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
              await repositories.examCandidates.closeCandidateIfMatch({
                subject: test.subject,
                candidateKey: open.candidateKey,
                expectedTestId: testId,
              });
            }

            await repositories.examCandidates.createCandidate({
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
            await repositories.examCandidates.releaseLockIfMatch({
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
      }),
    );

    return true;
  };
};
