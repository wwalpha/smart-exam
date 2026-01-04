import { Request, Response } from 'express';
import { KanjiRepository } from '@/repositories/kanjiRepository';
import { apiHandler } from '@/lib/handler';
import { CreateKanjiRequest, Kanji, KanjiListResponse } from '@smart-exam/api-types';

type ListKanjiRequest = Request<{}, KanjiListResponse, {}, {}>;
type CreateKanjiReq = Request<{}, Kanji, CreateKanjiRequest>;

export const listKanji = apiHandler(async (req: ListKanjiRequest, res: Response<KanjiListResponse>) => {
  const items = await KanjiRepository.listKanji();
  // Mapping to api-types structure (items vs datas)
  res.json({ items: items, total: items.length });
});

export const createKanji = apiHandler(async (req: CreateKanjiReq, res: Response<Kanji>) => {
  const item = await KanjiRepository.createKanji(req.body);
  res.status(201).json(item);
});
