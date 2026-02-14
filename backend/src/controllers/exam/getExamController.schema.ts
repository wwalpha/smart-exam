import { z } from 'zod';

/** GetExamParamsSchema validates path params. */
export const GetExamParamsSchema = z.object({
  // 取得対象のテストID
  testId: z.string().min(1),
});
