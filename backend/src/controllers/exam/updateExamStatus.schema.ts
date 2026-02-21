import { z } from 'zod';

/** UpdateExamStatusParamsSchema validates path params. */
export const UpdateExamStatusParamsSchema = z.object({
  // ステータス更新対象の試験ID
  examId: z.string().min(1),
});

/** UpdateExamStatusBodySchema validates input shape. */
export const UpdateExamStatusBodySchema = z.object({
  // 更新後のテストステータス
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
});
