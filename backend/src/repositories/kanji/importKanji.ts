import { WordsService } from '@/services/WordsService';
import type { ImportKanjiRequest, ImportKanjiResponse } from '@smart-exam/api-types';
import { createKanji } from './createKanji';
import { parsePipeLine } from './importUtils';
import { updateKanji } from './updateKanji';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';

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
      const histories = parsedPipe?.histories ?? [];
      if (!kanji) {
        errorCount += 1;
        errors.push({ line: index + 1, content: line, reason: '問題が空です' });
        continue;
      }

      const existingId = existingByQuestion.get(kanji);

      const wordId = existingId ?? null;

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
        const created = await createKanji({
          kanji,
          reading,
          subject,
        });
        existingByQuestion.set(kanji, created.id);
        successCount += 1;
      }

      const targetWordId = existingByQuestion.get(kanji);
      if (!targetWordId) {
        continue;
      }

      if (histories.length > 0) {
        await ReviewTestCandidatesService.deleteCandidatesByTargetId({ subject, targetId: targetWordId });

        const sorted = [...histories].sort((a, b) => (a.submittedAtIso < b.submittedAtIso ? -1 : 1));
        const recent = sorted.slice(Math.max(0, sorted.length - 3));

        // 古い履歴は履歴としてのみ残す（状態計算には使わない）
        for (const h of sorted.slice(0, Math.max(0, sorted.length - 3))) {
          const ymd = DateUtils.toYmd(h.submittedAtIso);
          await ReviewTestCandidatesService.createCandidate({
            subject,
            questionId: targetWordId,
            mode: 'KANJI',
            nextTime: ymd,
            correctCount: 0,
            status: 'CLOSED',
            createdAtIso: h.submittedAtIso,
          });
        }

        let streak = 0;
        let lastAttemptIso = '';
        let computedNextTime = '';
        let computedCorrectCount = 0;

        for (const h of recent) {
          const baseDateYmd = DateUtils.toYmd(h.submittedAtIso);
          const computed = ReviewNextTime.compute({
            mode: 'KANJI',
            baseDateYmd,
            isCorrect: h.isCorrect,
            currentCorrectCount: streak,
          });

          // 直近3回の履歴は、次状態を含めて履歴として残す
          await ReviewTestCandidatesService.createCandidate({
            subject,
            questionId: targetWordId,
            mode: 'KANJI',
            nextTime: computed.nextTime,
            correctCount: computed.nextCorrectCount,
            status: 'CLOSED',
            createdAtIso: h.submittedAtIso,
          });

          streak = computed.nextCorrectCount;
          lastAttemptIso = h.submittedAtIso;
          computedNextTime = computed.nextTime;
          computedCorrectCount = computed.nextCorrectCount;
        }

        if (computedNextTime && lastAttemptIso) {
          await ReviewTestCandidatesService.createCandidate({
            subject,
            questionId: targetWordId,
            mode: 'KANJI',
            nextTime: computedNextTime,
            correctCount: computedCorrectCount,
            status: computedNextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'OPEN',
            createdAtIso: lastAttemptIso,
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
};
