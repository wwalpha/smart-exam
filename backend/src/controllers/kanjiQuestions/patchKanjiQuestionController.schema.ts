import { z } from 'zod';

/** PatchKanjiQuestionBodySchema validates input shape. */
export const PatchKanjiQuestionBodySchema = z.object({
  readingHiragana: z.string().min(1).optional(),
  underlineSpec: z
    .object({
      type: z.literal('promptSpan'),
      start: z.number().int().nonnegative(),
      length: z.number().int().positive(),
    })
    .optional(),
});
