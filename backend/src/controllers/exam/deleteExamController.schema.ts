import { z } from 'zod';

/** DeleteExamParamsSchema validates path params. */
export const DeleteExamParamsSchema = z.object({
  // 削除対象のテストID
  testId: z.string().min(1),
});
