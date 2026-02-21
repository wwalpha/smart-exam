import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

// 採点結果を候補テーブルへ反映し、試験を COMPLETED に確定する。
export const createCompleteExam = (repositories: Repositories): ExamsService['completeExam'] => {
  return async (examId: string): Promise<boolean> => {
    const test = await repositories.exams.get(examId);
    if (!test) return false;

    // 冪等性のため、完了済みは成功扱いで即 return する。
    if (test.status === 'COMPLETED') {
      return true;
    }

    // 試験本体/明細どちらにも結果が入り得るため両方を突き合わせる。
    const details = await repositories.examDetails.listByExamId(examId);
    const resultByTargetId = new Map((test.results ?? []).map((result) => [result.id, result.isCorrect] as const));
    const lockedCandidates = await repositories.examCandidates.listLockedCandidatesByExamId({
      subject: test.subject,
      examId,
    });
    const lockedByTargetId = new Map(lockedCandidates.map((candidate) => [candidate.questionId, candidate] as const));

    const dateYmd = test.submittedDate ?? DateUtils.todayYmd();

    await Promise.all(
      details.map(async (detail) => {
        const isCorrect =
          typeof detail.isCorrect === 'boolean' ? detail.isCorrect : resultByTargetId.get(detail.targetId);

        const locked = lockedByTargetId.get(detail.targetId);

        const open = locked
          ? null
          : await repositories.examCandidates.getLatestOpenCandidateByTargetId({
              subject: test.subject,
              targetId: detail.targetId,
            });

        const currentCandidate = locked ?? open;

        try {
          if (typeof isCorrect === 'boolean') {
            // 採点済みの候補は履歴へ移してから次回候補を再作成する
            const computed = ReviewNextTime.compute({
              mode: test.mode,
              baseDateYmd: dateYmd,
              isCorrect,
              currentCorrectCount: currentCandidate ? currentCandidate.correctCount : 0,
            });

            if (locked) {
              await repositories.examCandidates.closeCandidateIfMatch({
                subject: test.subject,
                candidateKey: locked.candidateKey,
                expectedExamId: examId,
              });
            } else if (open) {
              await repositories.examCandidates.closeCandidateIfMatch({
                subject: test.subject,
                candidateKey: open.candidateKey,
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

          // 未採点の候補はロックだけ解除して次回へ持ち越す
          if (locked) {
            await repositories.examCandidates.releaseLockIfMatch({
              subject: test.subject,
              candidateKey: locked.candidateKey,
              examId,
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
          // 同時更新競合は許容し、処理全体は継続する。
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
