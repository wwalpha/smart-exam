import { WordsService } from '@/services/WordsService';
import type { ImportKanjiRequest, ImportKanjiResponse } from '@smart-exam/api-types';
import { createKanji } from './createKanji';
import { parsePipeLine } from './importUtils';
import { updateKanji } from './updateKanji';

export const importKanji = async (data: ImportKanjiRequest): Promise<ImportKanjiResponse> => {
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

      if (existingId) {
        if (data.mode === 'SKIP') {
          duplicateCount += 1;
          continue;
        }

        await updateKanji(existingId, {
          kanji,
          reading,
          subject,
        });
        successCount += 1;
      } else {
        await createKanji({
          kanji,
          reading,
          subject,
        });
        successCount += 1;
      }

      // WordTestTable を廃止したため、インポート履歴は永続化しない。
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
};
