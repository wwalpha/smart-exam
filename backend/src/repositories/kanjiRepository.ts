import { WordsService } from '../services/WordsService';
import { WordTable } from '../types/db';
import { Kanji, CreateKanjiRequest } from './repo.types';
import { createUuid } from '@/lib/uuid';
import { DateUtils } from '@/lib/dateUtils';
import type { ImportKanjiRequest, ImportKanjiResponse, UpdateKanjiRequest } from '@smart-exam/api-types';

export const KanjiRepository = {
  createKanji: async (data: CreateKanjiRequest): Promise<Kanji> => {
    const now = DateUtils.now();
    const id = createUuid();
    
    const item: Kanji = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const dbItem: WordTable = {
      wordId: id,
      question: data.kanji,
      answer: data.reading || '',
      answerHiragana: data.reading || '',
      wordType: 'KANJI',
      subject: data.subject,
      meaning: data.meaning,
      source: data.source,
      createdAt: now,
      updatedAt: now,
    };

    await WordsService.create(dbItem);

    return item;
  },

  getKanji: async (id: string): Promise<Kanji | null> => {
    const dbItem = await WordsService.get(id);
    if (!dbItem || dbItem.wordType !== 'KANJI') return null;
    return {
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      meaning: dbItem.meaning,
      subject: dbItem.subject,
      source: dbItem.source,
      createdAt: dbItem.createdAt || DateUtils.now(),
      updatedAt: dbItem.updatedAt || DateUtils.now(),
    };
  },

  updateKanji: async (id: string, data: UpdateKanjiRequest): Promise<Kanji | null> => {
    const now = DateUtils.now();
    const updated = await WordsService.update(id, {
      ...(data.kanji !== undefined ? { question: data.kanji } : {}),
      ...(data.reading !== undefined ? { answer: data.reading, answerHiragana: data.reading } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(data.meaning !== undefined ? { meaning: data.meaning } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      updatedAt: now,
    });
    if (!updated) return null;
    return {
      id: updated.wordId,
      kanji: updated.question,
      reading: updated.answer,
      meaning: updated.meaning,
      subject: updated.subject,
      source: updated.source,
      createdAt: updated.createdAt || now,
      updatedAt: updated.updatedAt || now,
    };
  },

  deleteKanji: async (id: string): Promise<boolean> => {
    const existing = await WordsService.get(id);
    if (!existing || existing.wordType !== 'KANJI') return false;
    await WordsService.delete(id);
    return true;
  },

  importKanji: async (data: ImportKanjiRequest): Promise<ImportKanjiResponse> => {
    const lines = data.fileContent
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

    const existing = await WordsService.listKanji();
    const existingByQuestion = new Map(existing.map((x) => [x.question, x.wordId] as const));

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: ImportKanjiResponse['errors'] = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const cols = line.split(/\t|,/).map((x) => x.trim());

      const kanji = cols[0];
      const reading = cols[1] ?? '';
      const meaning = cols[2] || undefined;
      const subject = (data.subject || cols[3] || undefined) as string | undefined;
      const source = cols[4] || undefined;

      if (!kanji) {
        errorCount += 1;
        errors.push({ line: index + 1, content: line, reason: '問題が空です' });
        continue;
      }

      const existingId = existingByQuestion.get(kanji);

      try {
        if (existingId) {
          if (data.mode === 'SKIP') {
            duplicateCount += 1;
            continue;
          }

          await KanjiRepository.updateKanji(existingId, {
            kanji,
            reading,
            meaning,
            subject,
            source,
          });
          successCount += 1;
          continue;
        }

        await KanjiRepository.createKanji({
          kanji,
          reading,
          meaning,
          subject,
          source,
        });
        successCount += 1;
      } catch (e) {
        errorCount += 1;
        errors.push({ line: index + 1, content: line, reason: e instanceof Error ? e.message : 'Unknown error' });
      }
    }

    return {
      successCount,
      duplicateCount,
      errorCount,
      errors,
    };
  },

  listKanji: async (): Promise<Kanji[]> => {
    const items = await WordsService.listKanji();
    
    return items.map(dbItem => ({
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      meaning: dbItem.meaning,
      subject: dbItem.subject,
      source: dbItem.source,
      createdAt: dbItem.createdAt || DateUtils.now(),
      updatedAt: dbItem.updatedAt || DateUtils.now(),
    }));
  }
};
