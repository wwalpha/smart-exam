// Module: searchExamsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { SearchExamsRequest, SearchExamsResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SearchExamsBodySchema } from './searchExamsController.schema';

/** Creates search review tests controller. */
export const searchExamsController = (services: Services) => {
  const searchExams: AsyncHandler<
    ParamsDictionary,
    SearchExamsResponse,
    SearchExamsRequest,
    ParsedQs
  > = async (req, res) => {
    // バリデーション済みの検索条件を取得する
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchExamsBodySchema>;
    // 条件に一致する復習テストを検索する
    const result = await services.exams.searchExams(body);
    // 検索結果を返す
    res.json(result);
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { SearchExamsBodySchema, searchExams };
};
