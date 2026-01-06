import type { ReviewTestCandidateTable } from '@/types/db';
import type { SubjectId } from '@smart-exam/api-types';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const listReviewTestCandidates = async (params: {
  subject?: SubjectId;
  mode?: 'QUESTION' | 'KANJI';
}): Promise<ReviewTestCandidateTable[]> => {
  return ReviewTestCandidatesService.listCandidates(params);
};
