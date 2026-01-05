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
  return DateUtils.parseYmdSlashToIso(ymd);
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
    const id = createUuid();
    
    const item: Kanji = { id, ...data };

    const dbItem: WordTable = {
      wordId: id,
      question: data.kanji,
      answer: data.reading || '',
      subject: data.subject,
      registeredDate: DateUtils.todayYmd(),
    };

    await WordsService.create(dbItem);

    return item;
  },

  getKanji: async (id: string): Promise<Kanji | null> => {
    const dbItem = await WordsService.get(id);
    if (!dbItem) return null;
    return {
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    };
  },

  updateKanji: async (id: string, data: UpdateKanjiRequest): Promise<Kanji | null> => {
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
  },

  deleteKanji: async (id: string): Promise<boolean> => {
    const existing = await WordsService.get(id);
    if (!existing) return false;
    await WordsService.delete(id);
    return true;
  },

  importKanji: async (data: ImportKanjiRequest): Promise<ImportKanjiResponse> => {
    if (!data.subject) {
      return {
        successCount: 0,
        duplicateCount: 0,
        errorCount: 1,
        errors: [{ line: 1, content: '', reason: '科目は必須です' }],
      };
    }

    const subject = data.subject;

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
            subject,
          });
          wordId = existingId;
          successCount += 1;
        } else {
          const created = await KanjiRepository.createKanji({
            kanji,
            reading,
            subject,
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
              results: [{ wordId, isCorrect: h.isCorrect, subject }],
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
      subject: dbItem.subject,
    }));
  }
};
