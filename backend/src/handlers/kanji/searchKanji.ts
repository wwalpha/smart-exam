import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { SearchKanjiRequest, SearchKanjiResponse } from '@smart-exam/api-types';

export const searchKanji: AsyncHandler<ParamsDictionary, SearchKanjiResponse, SearchKanjiRequest, ParsedQs> = async (
  req,
  res
) => {
  const items = await KanjiRepository.listKanji();
  const q = (req.body.q ?? '').trim();
  const reading = (req.body.reading ?? '').trim();
  const subject = (req.body.subject ?? '').trim();

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
