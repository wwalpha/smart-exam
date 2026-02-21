// Module: listExamTargetsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedQuery } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ListExamTargetsResponse, SubjectId } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { ListExamTargetsQuerySchema } from './listExamTargets.schema';

/** Creates list review test targets controller. */
export const listExamTargetsController = (services: Services) => {
  const listExamTargets: AsyncHandler<
    ParamsDictionary,
    ListExamTargetsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    // バリデーション済みクエリを取得する
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListExamTargetsQuerySchema>;

    // 期間・モード・科目条件で復習対象を取得する
    const items = await services.exams.listExamTargets({
      mode: q.mode,
      fromYmd: q.from,
      toYmd: q.to,
      subject: q.subject as SubjectId | undefined,
    });

    // 取得した対象一覧を返す
    res.json({ items });
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { ListExamTargetsQuerySchema, listExamTargets };
};
