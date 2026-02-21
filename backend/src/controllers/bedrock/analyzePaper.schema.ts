import { z } from 'zod';

/** AnalyzePaperBodySchema validates input shape. */
export const AnalyzePaperBodySchema = z.object({
  s3Key: z.string().min(1),
  subject: z.enum(['math', 'science', 'society']),
});
