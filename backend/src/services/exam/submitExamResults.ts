import { DateUtils } from '@/lib/dateUtils';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

// 採点結果を試験本体と明細の両方へ同期して保存する。
export const createSubmitExamResults = (repositories: Repositories): ExamsService['submitExamResults'] => {
  return async (examId: string, req: Parameters<ExamsService['submitExamResults']>[1]): Promise<boolean> => {
    const test = await repositories.exams.get(examId);
    if (!test) return false;

    // 採点日が省略された場合は当日を採用する。
    const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();
    const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));
    await repositories.exams.put({
      ...test,
      submittedDate: dateYmd,
      results: nextResults,
    });

    // 完了処理で参照できるように examDetails 側にも採点結果を書き戻す。
    await repositories.examDetails.updateResults(examId, nextResults);
    return true;
  };
};
