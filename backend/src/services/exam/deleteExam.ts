import type { Repositories } from '@/repositories/createRepositories';

// 試験削除時に、出題候補にかけたロックも合わせて解除する。
export const createDeleteExam = async (repositories: Repositories, examId: string): Promise<boolean> => {
  const existing = await repositories.exams.get(examId);
  if (!existing) return false;

  const lockedCandidates = await repositories.examCandidates.listLockedCandidatesByExamId({
    subject: existing.subject,
    examId,
  });
  const materialIdsToSync = new Set<string>();
  await Promise.all(
    lockedCandidates.map(async (candidate) => {
      const released = await repositories.examCandidates.releaseLockIfMatch({
        subject: existing.subject,
        candidateKey: candidate.candidateKey,
        examId,
      });
      if (released && candidate.mode === 'MATERIAL' && candidate.materialId) {
        // LOCKED→OPEN の遷移後に更新対象の教材IDを収集する。
        materialIdsToSync.add(candidate.materialId);
      }
    }),
  );

  // ロック解除処理が完了してから教材側件数を一括で追随させる。
  await Promise.all(
    Array.from(materialIdsToSync).map((materialId) =>
      repositories.examCandidates.syncMaterialOpenCandidateCount(materialId),
    ),
  );

  // 親テーブルと明細テーブルをセットで削除する。
  await repositories.exams.delete(examId);
  await repositories.examDetails.deleteByExamId(examId);
  return true;
};
