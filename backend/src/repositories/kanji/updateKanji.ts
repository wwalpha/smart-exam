import { WordsService } from '@/services/WordsService';
import type { Kanji } from '@/repositories/repo.types';
import type { UpdateKanjiRequest } from '@smart-exam/api-types';

export const updateKanji = async (id: string, data: UpdateKanjiRequest): Promise<Kanji | null> => {
  const updated = await WordsService.update(id, {
    ...(data.kanji !== undefined ? { question: data.kanji } : {}),
    ...(data.reading !== undefined ? { answer: data.reading } : {}),
    ...(data.subject !== undefined ? { subject: data.subject } : {}),
  });
  if (!updated) return null;
  return {
    id: updated.wordId,
    kanji: updated.question,
    reading: updated.answer,
    subject: updated.subject,
  };
};
