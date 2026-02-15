import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { UpdateKanjiParams, UpdateKanjiRequest, UpdateKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';
import { UpdateKanjiBodySchema } from './index';

// 漢字更新ハンドラを生成する
export const updateKanji = (
  services: Services,
): AsyncHandler<UpdateKanjiParams, UpdateKanjiResponse | { error: string }, UpdateKanjiRequest, ParsedQs> => {
  // Express用の非同期ハンドラを返す
  return async (req, res) => {
    // パスパラメータから対象漢字IDを取得する
    const { kanjiId } = req.params;
    // バリデーション済みの更新リクエストボディを取得する
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateKanjiBodySchema>;
    // サービス層で漢字データを更新する
    const item = await services.kanji.updateKanji(kanjiId, body as UpdateKanjiRequest);
    // 対象データが存在しない場合は404を返す
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    // 更新後の漢字データを返す
    res.json(item);
  };
};
