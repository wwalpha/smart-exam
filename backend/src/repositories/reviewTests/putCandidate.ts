import type { SubjectId } from '@smart-exam/api-types';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const putCandidate = async (params: {
  subject: SubjectId;
  questionId: string;
  mode: 'QUESTION' | 'KANJI';
  nextTime: string;
  testId?: string;
}): Promise<void> => {
  await ReviewTestCandidatesService.putCandidate(params);
};
