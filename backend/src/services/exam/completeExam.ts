import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

export const createCompleteExam = (repositories: Repositories): ExamsService['completeExam'] => {
  return async (examId: string): Promise<boolean> => {
    const test = await repositories.exams.get(examId);
    if (!test) return false;

    if (test.status === 'COMPLETED') {
      return true;
    }

    const details = await repositories.examDetails.listByExamId(examId);
    const resultByTargetId = new Map((test.results ?? []).map((result) => [result.id, result.isCorrect] as const));

    const dateYmd = test.submittedDate ?? DateUtils.todayYmd();

    await Promise.all(
      details.map(async (detail) => {
        const isCorrect =
          typeof detail.isCorrect === 'boolean' ? detail.isCorrect : resultByTargetId.get(detail.targetId);

        const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
          subject: test.subject,
          targetId: detail.targetId,
        });

        try {
          if (typeof isCorrect === 'boolean') {
            const computed = ReviewNextTime.compute({
              mode: test.mode,
              baseDateYmd: dateYmd,
              isCorrect,
              currentCorrectCount: open ? open.correctCount : 0,
            });

            if (open) {
              await repositories.examCandidates.closeCandidateIfMatch({
                subject: test.subject,
                candidateKey: open.candidateKey,
                expectedExamId: examId,
              });
            }

            await repositories.examCandidates.createCandidate({
              subject: test.subject,
              questionId: detail.targetId,
              mode: test.mode,
              nextTime: computed.nextTime,
              correctCount: computed.nextCorrectCount,
              status: computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'OPEN',
            });
            return;
          }

          if (open && open.examId === examId) {
            await repositories.examCandidates.releaseLockIfMatch({
              subject: test.subject,
              candidateKey: open.candidateKey,
              examId,
            });
          }
        } catch (error: unknown) {
          const name = (error as { name?: string } | null)?.name;
          if (name === 'ConditionalCheckFailedException') return;
          throw error;
        }
      }),
    );

    await repositories.exams.put({
      ...test,
      status: 'COMPLETED',
      submittedDate: dateYmd,
    });

    return true;
  };
};
