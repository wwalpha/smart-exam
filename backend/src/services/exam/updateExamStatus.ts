import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';
import type { UpdateExamStatusRequest } from '@smart-exam/api-types';

import { toApiExam } from './internal';
import { createCompleteExam } from './completeExam';
import { ApiError } from '@/lib/apiError';

// 試験ステータスのみを更新して API 形式で返す。
export const createUpdateExamStatus = async (
  repositories: Repositories,
  examId: string,
  req: UpdateExamStatusRequest,
) => {
  const existing = await repositories.exams.get(examId);
  if (!existing) return null;
  if (existing.mode === 'MATERIAL') {
    if (req.status === 'COMPLETED') {
      await createCompleteExam(repositories, examId);
      const completed = await repositories.exams.get(examId);
      return completed ? toApiExam(completed) : null;
    }
    if (existing.status === 'COMPLETED' || existing.completionStarted || existing.gradingToken || existing.deleting) {
      throw new ApiError('MATERIAL exam cannot be reopened or changed during processing', 409);
    }
  }

  const updated: ExamTable | null = await repositories.exams.updateStatus(examId, req.status);
  return updated ? toApiExam(updated) : null;
};
