import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamsService } from './index';
import { toApiExam } from './internal';

// 試験ステータスのみを更新して API 形式で返す。
export const createUpdateExamStatus = (repositories: Repositories): ExamsService['updateExamStatus'] => {
  return async (
    examId: string,
    req: Parameters<ExamsService['updateExamStatus']>[1],
  ): ReturnType<ExamsService['updateExamStatus']> => {
    const existing = await repositories.exams.get(examId);
    if (!existing) return null;

    const updated: ExamTable | null = await repositories.exams.updateStatus(examId, req.status);
    return updated ? toApiExam(updated) : null;
  };
};
