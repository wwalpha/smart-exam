import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type {
  CreateKanjiRequest,
  CreateKanjiResponse,
  DeleteKanjiParams,
  DeleteKanjiResponse,
  GetKanjiParams,
  GetKanjiResponse,
  ImportKanjiRequest,
  ImportKanjiResponse,
  KanjiListResponse,
  SearchKanjiRequest,
  SearchKanjiResponse,
  UpdateKanjiParams,
  UpdateKanjiRequest,
  UpdateKanjiResponse,
} from '@smart-exam/api-types';

export const listKanji: AsyncHandler<ParamsDictionary, KanjiListResponse, {}, ParsedQs> = async (req, res) => {
  const items = await KanjiRepository.listKanji();
  res.json({ items, total: items.length });
};

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

export const createKanji: AsyncHandler<ParamsDictionary, CreateKanjiResponse, CreateKanjiRequest, ParsedQs> = async (
  req,
  res
) => {
  const item = await KanjiRepository.createKanji(req.body);
  res.status(201).json(item);
};

export const getKanji: AsyncHandler<GetKanjiParams, GetKanjiResponse | { error: string }, {}, ParsedQs> = async (
  req,
  res
) => {
  const { kanjiId } = req.params;
  const item = await KanjiRepository.getKanji(kanjiId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const updateKanji: AsyncHandler<
  UpdateKanjiParams,
  UpdateKanjiResponse | { error: string },
  UpdateKanjiRequest,
  ParsedQs
> = async (req, res) => {
  const { kanjiId } = req.params;
  const item = await KanjiRepository.updateKanji(kanjiId, req.body);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const deleteKanji: AsyncHandler<
  DeleteKanjiParams,
  DeleteKanjiResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { kanjiId } = req.params;
  const deleted = await KanjiRepository.deleteKanji(kanjiId);
  if (!deleted) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};

export const importKanji: AsyncHandler<ParamsDictionary, ImportKanjiResponse, ImportKanjiRequest, ParsedQs> = async (
  req,
  res
) => {
  const result = await KanjiRepository.importKanji(req.body);
  res.json(result);
};
