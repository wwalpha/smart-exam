// Module: createKanjiController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type {
  CreateKanjiRequest,
  CreateKanjiResponse,
  DeleteKanjiParams,
  DeleteKanjiResponse,
  DeleteManyKanjiRequest,
  DeleteManyKanjiResponse,
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
import type { Services } from '@/services/createServices';

import {
  CreateKanjiBodySchema,
  DeleteManyKanjiBodySchema,
  ImportKanjiBodySchema,
  SearchKanjiBodySchema,
} from './createKanjiController.schema';

/** Creates kanji controller. */
export const kanjiController = (services: Services) => {
  const listKanji: AsyncHandler<ParamsDictionary, KanjiListResponse, Record<string, never>, ParsedQs> = async (
    _req,
    res,
  ) => {
    const items = await services.kanji.listKanji();
    res.json({ items, total: items.length });
  };

  const searchKanji: AsyncHandler<ParamsDictionary, SearchKanjiResponse, SearchKanjiRequest, ParsedQs> = async (
    req,
    res,
  ) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchKanjiBodySchema>;
    const result = await services.kanji.searchKanji(body);
    res.json(result);
  };

  const createKanji: AsyncHandler<
    ParamsDictionary,
    CreateKanjiResponse | { error: string },
    CreateKanjiRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateKanjiBodySchema>;
    const item = await services.kanji.createKanji(body);
    res.status(201).json(item);
  };

  const getKanji: AsyncHandler<
    GetKanjiParams,
    GetKanjiResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { kanjiId } = req.params;
    const item = await services.kanji.getKanji(kanjiId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const updateKanji: AsyncHandler<
    UpdateKanjiParams,
    UpdateKanjiResponse | { error: string },
    UpdateKanjiRequest,
    ParsedQs
  > = async (req, res) => {
    const { kanjiId } = req.params;
    const item = await services.kanji.updateKanji(kanjiId, req.body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const deleteKanji: AsyncHandler<
    DeleteKanjiParams,
    DeleteKanjiResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { kanjiId } = req.params;
    const deleted = await services.kanji.deleteKanji(kanjiId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(204).send();
  };

  const deleteManyKanji: AsyncHandler<
    ParamsDictionary,
    DeleteManyKanjiResponse | { error: string },
    DeleteManyKanjiRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof DeleteManyKanjiBodySchema>;
    await services.kanji.deleteManyKanji(body.kanjiIds);
    res.status(204).send();
  };

  const importKanji: AsyncHandler<ParamsDictionary, ImportKanjiResponse, ImportKanjiRequest, ParsedQs> = async (
    req,
    res,
  ) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof ImportKanjiBodySchema>;
    const result = await services.kanji.importKanji(body);
    res.json(result);
  };

  return {
    CreateKanjiBodySchema,
    SearchKanjiBodySchema,
    ImportKanjiBodySchema,
    DeleteManyKanjiBodySchema,
    listKanji,
    searchKanji,
    createKanji,
    getKanji,
    updateKanji,
    deleteKanji,
    deleteManyKanji,
    importKanji,
  };
};
