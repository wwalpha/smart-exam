import type { Repositories } from '@/repositories/createRepositories';

import type { ReviewTestsService } from './createReviewTestsService';

export const createDeleteReviewTest = (repositories: Repositories): ReviewTestsService['deleteReviewTest'] => {
  return async (testId): Promise<boolean> => {
    const existing = await repositories.reviewTests.get(testId);
    if (!existing) return false;

    await Promise.all(
      (existing.questions ?? []).map(async (targetId) => {
        try {
          const candidate = await repositories.reviewTestCandidates.getLatestCandidateByTargetId({
            subject: existing.subject,
            targetId,
          });
          if (!candidate) return;
          if (candidate.testId !== testId) return;

          await repositories.reviewTestCandidates.releaseLockIfMatch({
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

    await repositories.reviewTests.delete(testId);

    return true;
  };
};
