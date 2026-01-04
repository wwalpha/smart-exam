import { WordsService } from '../services/WordsService';
import { WordTable } from '../types/db';
import { Kanji, CreateKanjiRequest } from './repo.types';
import { createUuid } from '@/lib/uuid';
import { DateUtils } from '@/lib/dateUtils';
import type { ImportKanjiRequest, ImportKanjiResponse, UpdateKanjiRequest } from '@smart-exam/api-types';
import { WordTestAttemptRepository } from './wordTestAttemptRepository';

type ImportedHistoryEntry = {
  startedAtIso: string;
  submittedAtIso: string;
  isCorrect: boolean;
};

const parseOkNg = (raw: string): boolean | null => {
  const s = raw.trim().toUpperCase();
  if (s === 'OK') return true;
  if (s === 'NG') return false;
  return null;
};

const parseYmdToIso = (ymd: string): string | null => {
  const m = /^([0-9]{4})\/([0-9]{2})\/([0-9]{2})$/.exec(ymd.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const ms = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const dt = new Date(ms);
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  return dt.toISOString();
};

const parsePipeLine = (line: string): { kanji: string; reading: string; histories: ImportedHistoryEntry[] } => {
  const parts = line.split('|').map((x) => x.trim());
  if (parts.length < 2) {
    throw new Error('フォーマットが不正です');
  }

  const kanji = parts[0];
  const reading = parts[1];

  const histories: ImportedHistoryEntry[] = [];
  for (const token of parts.slice(2)) {
    if (!token) continue;
    const [dateRaw, okngRaw = ''] = token.split(',');
    const dateIso = parseYmdToIso(dateRaw ?? '');
    const okng = parseOkNg(okngRaw);
    if (!dateIso || okng === null) {
      throw new Error('履歴の形式が不正です');
    }
    histories.push({ startedAtIso: dateIso, submittedAtIso: dateIso, isCorrect: okng });
  }

  return { kanji, reading, histories };
};

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
    if (!data.subject || String(data.subject).trim().length === 0) {
      return {
        successCount: 0,
        duplicateCount: 0,
        errorCount: 1,
        errors: [{ line: 1, content: '', reason: '科目は必須です' }],
      };
    }

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
      try {
        const isPipeFormat = line.includes('|');

        const parsedPipe = isPipeFormat ? parsePipeLine(line) : null;
        const cols = isPipeFormat ? [] : line.split(/\t|,/).map((x) => x.trim());

        const kanji = parsedPipe?.kanji ?? cols[0];
        const reading = parsedPipe?.reading ?? (cols[1] ?? '');
        const meaning = parsedPipe ? undefined : (cols[2] || undefined);
        const subject = String(data.subject);
        const source = parsedPipe ? undefined : (cols[4] || undefined);

        if (!kanji) {
          errorCount += 1;
          errors.push({ line: index + 1, content: line, reason: '問題が空です' });
          continue;
        }

        const existingId = existingByQuestion.get(kanji);

        let wordId: string;
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
          wordId = existingId;
          successCount += 1;
        } else {
          const created = await KanjiRepository.createKanji({
            kanji,
            reading,
            meaning,
            subject,
            source,
          });
          wordId = created.id;
          successCount += 1;
        }

        const histories = parsedPipe?.histories ?? [];
        if (histories.length > 0) {
          const wordTestId = `kanji_import_${subject}`;
          for (const h of histories) {
            await WordTestAttemptRepository.createSubmittedAttempt({
              wordTestId,
              startedAt: h.startedAtIso,
              submittedAt: h.submittedAtIso,
              results: [{ wordId, isCorrect: h.isCorrect }],
            });
          }
        }
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
