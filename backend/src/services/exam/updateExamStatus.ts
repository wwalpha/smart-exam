import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';
import type { UpdateExamStatusRequest } from '@smart-exam/api-types';

import { toApiExam } from './internal';

// 試験ステータスのみを更新して API 形式で返す。
export const createUpdateExamStatus = async (
  repositories: Repositories,
  examId: string,
  req: UpdateExamStatusRequest,
) => {
  const existing = await repositories.exams.get(examId);
  if (!existing) return null;

  const updated: ExamTable | null = await repositories.exams.updateStatus(examId, req.status);
  return updated ? toApiExam(updated) : null;
};
