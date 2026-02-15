import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamsService } from './index';
import { toApiExam } from './internal';

// 内部で利用する補助処理を定義する
const updateExamStatusImpl = async (
  repositories: Repositories,
  testId: string,
  req: Parameters<ExamsService['updateExamStatus']>[1],
): ReturnType<ExamsService['updateExamStatus']> => {
  // 非同期で必要な値を取得する
  const existing = await repositories.exams.get(testId);
  // 条件に応じて処理を分岐する
  if (!existing) return null;

  const updated: ExamTable | null = await repositories.exams.updateStatus(testId, req.status);
  // 処理結果を呼び出し元へ返す
  return updated ? toApiExam(updated) : null;
};

// 公開するサービス処理を定義する
export const createUpdateExamStatus = (
  repositories: Repositories,
): ExamsService['updateExamStatus'] => {
  // 処理結果を呼び出し元へ返す
  return updateExamStatusImpl.bind(null, repositories);
};
