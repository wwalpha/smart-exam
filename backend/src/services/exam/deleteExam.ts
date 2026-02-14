import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './createExamsService';

export const createDeleteExam = (repositories: Repositories): ExamsService['deleteExam'] => {
  return async (testId): Promise<boolean> => {
    const existing = await repositories.exams.get(testId);
    if (!existing) return false;

    await Promise.all(
      (existing.questions ?? []).map(async (targetId) => {
        try {
          const candidate = await repositories.examCandidates.getLatestCandidateByTargetId({
            subject: existing.subject,
            targetId,
          });
          if (!candidate) return;
          if (candidate.testId !== testId) return;

          await repositories.examCandidates.releaseLockIfMatch({
            subject: existing.subject,
            candidateKey: candidate.candidateKey,
            testId,
          });
        } catch (e: unknown) {
          const name = (e as { name?: string } | null)?.name;
          if (name === 'ConditionalCheckFailedException') return;
          throw e;
        }
      }),
    );

    await repositories.exams.delete(testId);

    return true;
  };
};
