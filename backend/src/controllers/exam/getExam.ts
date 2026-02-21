// Module: getExamController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { GetExamParams, GetExamResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { GetExamParamsSchema } from './getExam.schema';

/** Creates get review test controller. */
export const getExamController = (services: Services) => {
  const getExam: AsyncHandler<
    GetExamParams,
    GetExamResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    // パスパラメータから対象試験IDを取得する
    const { examId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof GetExamParamsSchema>;
    // 指定した復習テストを取得する
    const item = await services.exams.getExam(examId);
    // 対象が存在しない場合は404を返す
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    // 取得結果をJSONで返す
    res.json(item);
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { GetExamParamsSchema, getExam };
};
