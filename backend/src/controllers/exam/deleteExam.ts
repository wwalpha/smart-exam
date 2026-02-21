import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { DeleteExamParams } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { DeleteExamParamsSchema } from './deleteExam.schema';

/** Creates delete review test controller. */
export const deleteExamController = (services: Services) => {
  const deleteExam: AsyncHandler<DeleteExamParams, void, Record<string, never>, ParsedQs> = async (req, res) => {
    // パスパラメータから対象試験IDを取得する
    const { examId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof DeleteExamParamsSchema>;
    // 指定した復習テストを削除する
    await services.exams.deleteExam(examId);
    // 削除成功時は本文なしで204を返す
    res.status(204).send();
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { DeleteExamParamsSchema, deleteExam };
};
