import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamsService } from './createExamsService';
import { toApiExam } from './internal';

export const createUpdateExamStatus = (
  repositories: Repositories,
): ExamsService['updateExamStatus'] => {
  return async (testId, req) => {
    const existing = await repositories.exams.get(testId);
    if (!existing) return null;

    const updated: ExamTable | null = await repositories.exams.updateStatus(testId, req.status);
    return updated ? toApiExam(updated) : null;
  };
};
