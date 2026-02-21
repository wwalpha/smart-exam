import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
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

  const dateYmd = test.submittedDate ?? DateUtils.todayYmd();
  const closedAt = DateUtils.now();

  await Promise.all(
    details.map(async (detail) => {
      const isCorrect =
        typeof detail.isCorrect === 'boolean' ? detail.isCorrect : resultByTargetId.get(detail.targetId);

      // questionId をキーに候補を取り、examId が一致するものを今回の既存候補として扱う。
      const candidates = await repositories.examCandidates.listCandidatesByTargetId({ targetId: detail.targetId });
      const currentCandidate =
        candidates.find((candidate) => candidate.subject === test.subject && candidate.examId === examId) ?? null;

      // 既存候補は必ず履歴へ移してから削除する。
      if (currentCandidate) {
        const history: ExamHistoryTable = {
          subject: currentCandidate.subject,
          candidateKey: currentCandidate.candidateKey,
          id: currentCandidate.id,
          questionId: currentCandidate.questionId,
          mode: currentCandidate.mode,
          status: 'CLOSED',
          correctCount: currentCandidate.correctCount,
          nextTime: currentCandidate.nextTime,
          closedAt,
        };

        await repositories.examHistories.putHistory(history);
        await repositories.examCandidates.deleteCandidate({
          subject: currentCandidate.subject,
          candidateKey: currentCandidate.candidateKey,
        });
      }

      // 採点済みのみ次回候補を再作成する。
      if (typeof isCorrect === 'boolean') {
        const baseCandidate: Pick<ExamCandidateTable, 'correctCount'> | null = currentCandidate;
        const computed = ReviewNextTime.compute({
          mode: test.mode,
          baseDateYmd: dateYmd,
          isCorrect,
          currentCorrectCount: baseCandidate ? baseCandidate.correctCount : 0,
        });

        await repositories.examCandidates.createCandidate({
          subject: test.subject,
          questionId: detail.targetId,
          mode: test.mode,
          nextTime: computed.nextTime,
          correctCount: computed.nextCorrectCount,
          status: computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'OPEN',
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
