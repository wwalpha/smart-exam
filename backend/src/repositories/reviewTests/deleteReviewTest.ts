import { ReviewTestsService } from '@/services';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const deleteReviewTest = async (testId: string): Promise<boolean> => {
  const existing = await ReviewTestsService.get(testId);
  if (!existing) return false;

  if (existing.mode === 'QUESTION') {
    await Promise.all(
      (existing.questions ?? []).map(async (targetId) => {
        try {
          const open = await ReviewTestCandidatesService.getLatestOpenCandidateByTargetId({
            subject: existing.subject,
            targetId,
          });
          if (!open) return;
          if (open.testId !== testId) return;

          await ReviewTestCandidatesService.releaseLockIfMatch({
            subject: existing.subject,
            candidateKey: open.candidateKey,
            testId,
          });
        } catch (e: unknown) {
          const name = (e as { name?: string } | null)?.name;
          if (name === 'ConditionalCheckFailedException') return;
          throw e;
        }
      })
    );
  }

  await ReviewTestsService.delete(testId);

  return true;
};
