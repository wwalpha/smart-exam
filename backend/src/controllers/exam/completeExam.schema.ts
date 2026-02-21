import { z } from 'zod';

export const CompleteExamParamsSchema = z.object({
  examId: z.string().min(1),
});
