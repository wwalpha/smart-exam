import type { ReviewTestCandidateTable } from '@/types/db';
import type { ReviewMode, SubjectId } from '@smart-exam/api-types';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const listReviewTestCandidates = async (params: {
  subject?: SubjectId;
  mode?: ReviewMode;
}): Promise<ReviewTestCandidateTable[]> => {
  return ReviewTestCandidatesService.listCandidates(params);
};
