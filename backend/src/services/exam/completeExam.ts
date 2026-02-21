import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, ExamHistoryTable } from '@/types/db';

export const createCompleteExam = async (repositories: Repositories, examId: string): Promise<boolean> => {
  const test = await repositories.exams.get(examId);
  if (!test) return false;

  // 冪等性のため、完了済みは成功扱いで即 return する。
  if (test.status === 'COMPLETED') {
    return true;
  }

  // 試験本体/明細どちらにも結果が入り得るため両方を突き合わせる。
  const details = await repositories.examDetails.listByExamId(examId);
  const resultByTargetId = new Map((test.results ?? []).map((result) => [result.id, result.isCorrect] as const));
  const detailResultByTargetId = new Map(
    details
      .filter((detail) => typeof detail.isCorrect === 'boolean')
      .map((detail) => [detail.targetId, detail.isCorrect as boolean] as const),
  );
  const lockedCandidates = await repositories.examCandidates.listLockedCandidatesByExamId({
    subject: test.subject,
    examId,
  });

  const dateYmd = test.submittedDate ?? DateUtils.todayYmd();
  const closedAt = DateUtils.now();

  await Promise.all(
    lockedCandidates.map(async (candidate) => {
      const isCorrect = detailResultByTargetId.get(candidate.questionId) ?? resultByTargetId.get(candidate.questionId);

      // LOCKED 候補は必ず履歴へ移してから削除する。
      {
        const history: ExamHistoryTable = {
          id: candidate.id,
          subject: candidate.subject,
          questionId: candidate.questionId,
          mode: candidate.mode,
          status: 'CLOSED',
          correctCount: candidate.correctCount,
          nextTime: candidate.nextTime,
          closedAt,
        };

        await repositories.examHistories.putHistory(history);
        await repositories.examCandidates.deleteCandidate({
          subject: candidate.subject,
          candidateKey: candidate.candidateKey,
        });
      }

      // 採点済みのみ次回候補を再作成する。
      if (typeof isCorrect === 'boolean') {
        const baseCandidate: Pick<ExamCandidateTable, 'correctCount'> = candidate;
        const computed = ReviewNextTime.compute({
          mode: test.mode,
          baseDateYmd: dateYmd,
          isCorrect,
          currentCorrectCount: baseCandidate.correctCount,
        });

        // 3回連続正解で EXCLUDED になる場合は候補テーブルに残さず履歴テーブルへ保存する。
        if (computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME) {
          const excludedId = createUuid();
          const excludedHistory: ExamHistoryTable = {
            id: excludedId,
            subject: test.subject,
            questionId: candidate.questionId,
            mode: test.mode,
            status: 'EXCLUDED',
            correctCount: computed.nextCorrectCount,
            nextTime: computed.nextTime,
            closedAt,
          };
          await repositories.examHistories.putHistory(excludedHistory);
          return;
        }

        await repositories.examCandidates.createCandidate({
          subject: test.subject,
          questionId: candidate.questionId,
          mode: test.mode,
          nextTime: computed.nextTime,
          correctCount: computed.nextCorrectCount,
          status: 'OPEN',
        });
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
