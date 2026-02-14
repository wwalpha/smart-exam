import type { ReviewMode, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable } from '@/types/db';

import type { ExamsService } from './createExamsService';

export const createListExamCandidates = (
  repositories: Repositories,
): ExamsService['listExamCandidates'] => {
  return async (params: { subject?: SubjectId; mode?: ReviewMode }): Promise<ExamCandidateTable[]> => {
    return await repositories.examCandidates.listCandidates(params);
  };
};
