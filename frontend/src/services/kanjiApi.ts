import { apiRequest } from './apiClient';
import type {
  Kanji,
  KanjiListResponse,
  CreateKanjiRequest,
  UpdateKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
} from '@smart-exam/api-types';

export const listKanji = async (params?: {
  q?: string;
  reading?: string;
  subject?: string;
  limit?: number;
  cursor?: string;
}): Promise<KanjiListResponse> => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
  }
  return apiRequest<KanjiListResponse>({
    method: 'GET',
    path: `/api/kanji?${query.toString()}`,
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

export const importKanji = async (request: ImportKanjiRequest): Promise<ImportKanjiResponse> => {
  return apiRequest<ImportKanjiResponse, ImportKanjiRequest>({
    method: 'POST',
    path: '/api/kanji/import',
    body: request,
  });
};
