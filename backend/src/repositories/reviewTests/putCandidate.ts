import type { SubjectId } from '@smart-exam/api-types';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const putCandidate = async (params: {
  subject: SubjectId;
  candidateKey: string;
  testId: string;
}): Promise<void> => {
  await ReviewTestCandidatesService.lockCandidateIfUnlocked({
    subject: params.subject,
    candidateKey: params.candidateKey,
    testId: params.testId,
  });
};
