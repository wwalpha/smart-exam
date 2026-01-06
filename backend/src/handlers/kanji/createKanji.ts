import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { CreateKanjiRequest, CreateKanjiResponse } from '@smart-exam/api-types';

export const createKanji: AsyncHandler<
  ParamsDictionary,
  CreateKanjiResponse | { error: string },
  CreateKanjiRequest,
  ParsedQs
> = async (req, res) => {
  if (!req.body.subject || String(req.body.subject).trim().length === 0) {
    res.status(400).json({ error: 'subject is required' });
    return;
  }
  const item = await KanjiRepository.createKanji(req.body);
  res.status(201).json(item);
};
