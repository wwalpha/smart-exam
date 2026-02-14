import { z } from 'zod';

import { SubjectIdSchema } from '@/lib/zodSchemas';

/** CreateKanjiBodySchema validates input shape. */
export const CreateKanjiBodySchema = z.object({
  kanji: z.string().min(1),
  reading: z.string().optional(),
  subject: SubjectIdSchema,
});

/** SearchKanjiBodySchema validates input shape. */
export const SearchKanjiBodySchema = z.object({
  q: z.string().optional(),
  reading: z.string().optional(),
  subject: SubjectIdSchema.optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

/** ImportKanjiBodySchema validates input shape. */
export const ImportKanjiBodySchema = z.object({
  fileContent: z.string().min(1),
  subject: SubjectIdSchema,
});

/** DeleteManyKanjiBodySchema validates input shape. */
export const DeleteManyKanjiBodySchema = z.object({
  kanjiIds: z.array(z.string().min(1)).min(1),
});
