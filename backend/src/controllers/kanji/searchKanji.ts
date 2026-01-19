import { KanjiRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { SearchKanjiRequest, SearchKanjiResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';
import { SubjectIdSchema } from '@/lib/zodSchemas';

export const SearchKanjiBodySchema = z.object({
  q: z.string().optional(),
  reading: z.string().optional(),
  subject: SubjectIdSchema.optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export const searchKanji: AsyncHandler<ParamsDictionary, SearchKanjiResponse, SearchKanjiRequest, ParsedQs> = async (
  req,
  res
) => {
  const items = await KanjiRepository.listKanji();
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchKanjiBodySchema>;
  const q = (body.q ?? '').trim();
  const reading = (body.reading ?? '').trim();
  const subject = (body.subject ?? '').trim();

  const qLower = q.toLowerCase();
  const readingLower = reading.toLowerCase();
  const subjectLower = subject.toLowerCase();

  const filtered = items.filter((x) => {
    if (qLower && !String(x.kanji ?? '').toLowerCase().includes(qLower)) return false;
    if (readingLower && !String(x.reading ?? '').toLowerCase().includes(readingLower)) return false;
    if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
    return true;
  });

  res.json({ items: filtered, total: filtered.length });
};
