// Module: submitExamResultsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { SubmitExamResultsParams, SubmitExamResultsRequest } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SubmitExamResultsBodySchema, SubmitExamResultsParamsSchema } from './submitExamResultsController.schema';

/** Creates submit review test results controller. */
export const submitExamResultsController = (services: Services) => {
  const submitExamResults: AsyncHandler<
    SubmitExamResultsParams,
    void | { error: string },
    SubmitExamResultsRequest,
    ParsedQs
  > = async (req, res) => {
    // パスパラメータから対象テストIDを取得する
    const { testId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof SubmitExamResultsParamsSchema>;
    // バリデーション済みの回答結果を取得する
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SubmitExamResultsBodySchema>;

    // 復習テスト結果を保存する
    const ok = await services.exams.submitExamResults(testId, body);
    // 対象が存在しない場合は404を返す
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    // 更新成功時は本文なしで204を返す
    res.status(204).send();
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { SubmitExamResultsParamsSchema, SubmitExamResultsBodySchema, submitExamResults };
};
