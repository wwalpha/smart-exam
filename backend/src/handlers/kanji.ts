import { KanjiRepository } from '@/repositories/kanjiRepository';
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
  UpdateKanjiParams,
  UpdateKanjiRequest,
  UpdateKanjiResponse,
} from '@smart-exam/api-types';

export const listKanji: AsyncHandler<ParamsDictionary, KanjiListResponse, {}, ParsedQs> = async (req, res) => {
  const items = await KanjiRepository.listKanji();
  // Mapping to api-types structure (items vs datas)
  res.json({ items: items, total: items.length });
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
  res.json({});
};

export const importKanji: AsyncHandler<ParamsDictionary, ImportKanjiResponse, ImportKanjiRequest, ParsedQs> = async (
  req,
  res
) => {
  const result = await KanjiRepository.importKanji(req.body);
  res.json(result);
};
