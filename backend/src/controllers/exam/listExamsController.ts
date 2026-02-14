// Module: listExamsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { Services } from '@/services/createServices';

import { ListExamsQuerySchema } from './listExamsController.schema';

/** Creates list review tests controller. */
export const listExamsController = (services: Services) => {
  const listExams: AsyncHandler<
    ParamsDictionary,
    { items: unknown[]; total: number },
    Record<string, never>,
    ParsedQs
  > = async (_req, res) => {
    // 復習テスト一覧を取得する
    const items = await services.exams.listExams();
    // 件数付きで一覧を返す
    res.json({ items, total: items.length });
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { ListExamsQuerySchema, listExams };
};
