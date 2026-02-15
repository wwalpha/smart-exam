import { z } from 'zod';

/** DeleteExamParamsSchema validates path params. */
export const DeleteExamParamsSchema = z.object({
  // 削除対象の試験ID
  examId: z.string().min(1),
});
