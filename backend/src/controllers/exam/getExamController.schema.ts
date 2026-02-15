import { z } from 'zod';

/** GetExamParamsSchema validates path params. */
export const GetExamParamsSchema = z.object({
  // 取得対象の試験ID
  examId: z.string().min(1),
});
