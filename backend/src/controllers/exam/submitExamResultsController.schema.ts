import { z } from 'zod';

/** SubmitExamResultsParamsSchema validates path params. */
export const SubmitExamResultsParamsSchema = z.object({
  // 結果登録対象の試験ID
  examId: z.string().min(1),
});

/** SubmitExamResultsBodySchema validates input shape. */
export const SubmitExamResultsBodySchema = z.object({
  // 問題ごとの採点結果一覧
  results: z.array(
    z.object({
      // 採点対象の問題ID
      id: z.string().min(1),
      // 正誤判定結果
      isCorrect: z.boolean(),
    }),
  ),
  // 実施日（省略時はサーバー側デフォルト）
  date: z.string().optional(),
});
