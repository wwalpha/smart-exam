import { Request, Response } from 'express';
import { KanjiRepository } from '@/repositories/kanjiRepository';
import { apiHandler } from '@/lib/handler';
import type { CreateKanjiRequest, CreateKanjiResponse, KanjiListResponse as KanjiListResponseBody } from '@smart-exam/api-types';

type KanjiListRequest = Request<{}, KanjiListResponseBody, {}, {}>;
type KanjiListResponse = Response<KanjiListResponseBody>;

type CreateKanjiReq = Request<{}, CreateKanjiResponse, CreateKanjiRequest>;
type CreateKanjiRes = Response<CreateKanjiResponse>;

export const listKanji = apiHandler(
  async (req: KanjiListRequest, res: KanjiListResponse) => {
    const items = await KanjiRepository.listKanji();
    // Mapping to api-types structure (items vs datas)
    res.json({ items: items, total: items.length });
  }
);

export const createKanji = apiHandler(
  async (req: CreateKanjiReq, res: CreateKanjiRes) => {
    const item = await KanjiRepository.createKanji(req.body);
    res.status(201).json(item);
  }
);
