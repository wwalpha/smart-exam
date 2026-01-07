import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { DeleteManyKanjiRequest, DeleteManyKanjiResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

export const DeleteManyKanjiBodySchema = z.object({
  kanjiIds: z.array(z.string().min(1)).min(1),
});

export const deleteManyKanji: AsyncHandler<
  ParamsDictionary,
  DeleteManyKanjiResponse | { error: string },
  DeleteManyKanjiRequest,
  ParsedQs
> = async (req, res) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof DeleteManyKanjiBodySchema>;
  await KanjiRepository.deleteManyKanji(body.kanjiIds);
  res.status(204).send();
};
