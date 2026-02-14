import type { ReviewMode, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestCandidateTable } from '@/types/db';

import type { ReviewTestsService } from './createExamsService';

export const createListReviewTestCandidates = (
  repositories: Repositories,
): ReviewTestsService['listExamCandidates'] => {
  return async (params: { subject?: SubjectId; mode?: ReviewMode }): Promise<ReviewTestCandidateTable[]> => {
    return await repositories.reviewTestCandidates.listCandidates(params);
  };
};
