import { KanjiRepository } from '@/repositories/kanjiRepository';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type {
  CreateKanjiRequest,
  CreateKanjiResponse,
  KanjiListResponse,
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
