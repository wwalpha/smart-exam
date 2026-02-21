import type { SearchExamsResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';
import { toApiExam } from './internal';

// 条件検索結果を作成日降順で返す。
export const createSearchExams = (repositories: Repositories): ExamsService['searchExams'] => {
  return async (params: Parameters<ExamsService['searchExams']>[0]): Promise<SearchExamsResponse> => {
    const rows = await repositories.exams.search({
      mode: params.mode,
      subject: params.subject,
      status: params.status,
    });

    // 同日データは examId で順序を固定してページング差分を減らす。
    rows.sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      return a.examId < b.examId ? 1 : -1;
    });

    const filtered = rows.map(toApiExam);
    return { items: filtered, total: filtered.length };
  };
};
