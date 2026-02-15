import type { SearchExamsResponse } from '@smart-exam/api-types';

import type { ExamsService } from './index';

// 内部で利用する補助処理を定義する
const searchExamsImpl = async (
  deps: { listExams: ExamsService['listExams'] },
  params: Parameters<ExamsService['searchExams']>[0],
): Promise<SearchExamsResponse> => {
  // 非同期で必要な値を取得する
  const items = await deps.listExams();

  // 処理で使う値を準備する
  const filtered = items.filter((x) => {
    // 条件に応じて処理を分岐する
    if (x.mode !== params.mode) return false;
    // 条件に応じて処理を分岐する
    if (params.subject !== 'ALL' && x.subject !== params.subject) return false;
    // 条件に応じて処理を分岐する
    if (params.status && params.status !== 'ALL' && x.status !== params.status) return false;
    // 処理結果を呼び出し元へ返す
    return true;
  });

  // 処理結果を呼び出し元へ返す
  return { items: filtered, total: filtered.length };
};

// 公開するサービス処理を定義する
export const createSearchExams = (deps: {
  listExams: ExamsService['listExams'];
}): ExamsService['searchExams'] => {
  // 処理結果を呼び出し元へ返す
  return searchExamsImpl.bind(null, deps);
};
