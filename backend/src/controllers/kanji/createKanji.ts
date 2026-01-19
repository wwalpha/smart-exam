import { KanjiRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { CreateKanjiRequest, CreateKanjiResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';
import { SubjectIdSchema } from '@/lib/zodSchemas';

export const CreateKanjiBodySchema = z.object({
  kanji: z.string().min(1),
  reading: z.string().optional(),
  subject: SubjectIdSchema,
});

export const createKanji: AsyncHandler<
  ParamsDictionary,
  CreateKanjiResponse | { error: string },
  CreateKanjiRequest,
  ParsedQs
> = async (req, res) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateKanjiBodySchema>;
  const item = await KanjiRepository.createKanji(body);
  res.status(201).json(item);
};
