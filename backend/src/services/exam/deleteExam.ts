import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

// 試験削除時に、出題候補にかけたロックも合わせて解除する。
export const createDeleteExam = (repositories: Repositories): ExamsService['deleteExam'] => {
  return async (examId: string): Promise<boolean> => {
    const existing = await repositories.exams.get(examId);
    if (!existing) return false;

    const lockedCandidates = await repositories.examCandidates.listLockedCandidatesByExamId({
      subject: existing.subject,
      examId,
    });
    await Promise.all(
      lockedCandidates.map(async (candidate) => {
        try {
          await repositories.examCandidates.releaseLockIfMatch({
            subject: existing.subject,
            candidateKey: candidate.candidateKey,
            examId,
          });
        } catch (e: unknown) {
          // すでに別経路で解除済みなら無視し、その他の失敗は伝播する。
          const name = (e as { name?: string } | null)?.name;
          if (name === 'ConditionalCheckFailedException') return;
          throw e;
        }
      }),
    );

    // 親テーブルと明細テーブルをセットで削除する。
    await repositories.exams.delete(examId);
    await repositories.examDetails.deleteByExamId(examId);
    return true;
  };
};
