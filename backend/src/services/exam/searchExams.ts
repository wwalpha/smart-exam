import type { SearchExamsResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';
import { toApiExam } from './internal';

// 公開するサービス処理を定義する
export const createSearchExams = (repositories: Repositories): ExamsService['searchExams'] => {
  // 処理結果を呼び出し元へ返す
  return async (params: Parameters<ExamsService['searchExams']>[0]): Promise<SearchExamsResponse> => {
    const rows = await repositories.exams.search({
      mode: params.mode,
      subject: params.subject,
      status: params.status,
    });

    rows.sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      return a.examId < b.examId ? 1 : -1;
    });

    const filtered = rows.map(toApiExam);

    // 処理結果を呼び出し元へ返す
    return { items: filtered, total: filtered.length };
  };
};
