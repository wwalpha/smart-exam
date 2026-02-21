import { DateUtils } from '@/lib/dateUtils';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

// 公開するサービス処理を定義する
export const createSubmitExamResults = (repositories: Repositories): ExamsService['submitExamResults'] => {
  // 処理結果を呼び出し元へ返す
  return async (examId: string, req: Parameters<ExamsService['submitExamResults']>[1]): Promise<boolean> => {
    // 非同期で必要な値を取得する
    const test = await repositories.exams.get(examId);
    // 条件に応じて処理を分岐する
    if (!test) return false;

    // 処理で使う値を準備する
    const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();

    // 処理で使う値を準備する
    const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));

    // 非同期処理の完了を待つ
    await repositories.exams.put({
      ...test,
      submittedDate: dateYmd,
      results: nextResults,
    });

    await repositories.examDetails.updateResults(examId, nextResults);

    // 処理結果を呼び出し元へ返す
    return true;
  };
};
