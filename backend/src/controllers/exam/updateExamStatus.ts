// Module: updateExamStatusController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { UpdateExamStatusParams, UpdateExamStatusRequest, UpdateExamStatusResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { UpdateExamStatusBodySchema, UpdateExamStatusParamsSchema } from './updateExamStatus.schema';

/** Creates update review test status controller. */
export const updateExamStatusController = (services: Services) => {
  const updateExamStatus: AsyncHandler<
    UpdateExamStatusParams,
    UpdateExamStatusResponse | { error: string },
    UpdateExamStatusRequest,
    ParsedQs
  > = async (req, res) => {
    // パスパラメータから対象試験IDを取得する
    const { examId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof UpdateExamStatusParamsSchema>;
    // バリデーション済みの更新内容を取得する
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateExamStatusBodySchema>;
    // 復習テストのステータスを更新する
    const item = await services.exams.updateExamStatus(examId, body);
    // 対象が存在しない場合は404を返す
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    // 更新結果を返す
    res.json(item);
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { UpdateExamStatusParamsSchema, UpdateExamStatusBodySchema, updateExamStatus };
};
