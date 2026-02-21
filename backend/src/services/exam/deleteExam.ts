import type { Repositories } from '@/repositories/createRepositories';

// 試験削除時に、出題候補にかけたロックも合わせて解除する。
export const createDeleteExam = async (repositories: Repositories, examId: string): Promise<boolean> => {
  const existing = await repositories.exams.get(examId);
  if (!existing) return false;

  const lockedCandidates = await repositories.examCandidates.listLockedCandidatesByExamId({
    subject: existing.subject,
    examId,
  });
  await Promise.all(
    lockedCandidates.map((candidate) =>
      repositories.examCandidates.releaseLockIfMatch({
        subject: existing.subject,
        candidateKey: candidate.candidateKey,
        examId,
      }),
    ),
  );

  // 親テーブルと明細テーブルをセットで削除する。
  await repositories.exams.delete(examId);
  await repositories.examDetails.deleteByExamId(examId);
  return true;
};
