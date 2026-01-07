import { apiRequest } from './apiClient';
import type {
  Kanji,
  KanjiListResponse,
  SearchKanjiRequest,
  CreateKanjiRequest,
  UpdateKanjiRequest,
  DeleteManyKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
} from '@smart-exam/api-types';

export const listKanji = async (params?: SearchKanjiRequest): Promise<KanjiListResponse> => {
  return apiRequest<KanjiListResponse, SearchKanjiRequest>({
    method: 'POST',
    path: '/api/kanji/search',
    body: params ?? {},
  });
};

export const createKanji = async (request: CreateKanjiRequest): Promise<Kanji> => {
  return apiRequest<Kanji, CreateKanjiRequest>({
    method: 'POST',
    path: '/api/kanji',
    body: request,
  });
};

export const getKanji = async (kanjiId: string): Promise<Kanji> => {
  return apiRequest<Kanji>({
    method: 'GET',
    path: `/api/kanji/${kanjiId}`,
  });
};

export const updateKanji = async (kanjiId: string, request: UpdateKanjiRequest): Promise<Kanji> => {
  return apiRequest<Kanji, UpdateKanjiRequest>({
    method: 'PATCH',
    path: `/api/kanji/${kanjiId}`,
    body: request,
  });
};

export const deleteKanji = async (kanjiId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/kanji/${kanjiId}`,
  });
};

export const deleteManyKanji = async (request: DeleteManyKanjiRequest): Promise<void> => {
  return apiRequest<void, DeleteManyKanjiRequest>({
    method: 'POST',
    path: '/api/kanji/deletions',
    body: request,
  });
};

export const importKanji = async (request: ImportKanjiRequest): Promise<ImportKanjiResponse> => {
  return apiRequest<ImportKanjiResponse, ImportKanjiRequest>({
    method: 'POST',
    path: '/api/kanji/import',
    body: request,
  });
};
