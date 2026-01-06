import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ImportKanjiRequest, ImportKanjiResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

const SubjectIdSchema = z.enum(['1', '2', '3', '4']);

export const ImportKanjiBodySchema = z.object({
  fileContent: z.string().min(1),
  mode: z.enum(['SKIP', 'UPDATE']),
  subject: SubjectIdSchema.optional(),
});

export const importKanji: AsyncHandler<ParamsDictionary, ImportKanjiResponse, ImportKanjiRequest, ParsedQs> = async (
  req,
  res
) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof ImportKanjiBodySchema>;
  const result = await KanjiRepository.importKanji(body);
  res.json(result);
};
