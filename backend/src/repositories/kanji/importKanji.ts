import { WordMasterService } from '@/services/WordMasterService';
import type { ImportKanjiRequest, ImportKanjiResponse } from '@smart-exam/api-types';
import { createKanji } from './createKanji';
import { parsePipeLine } from './importUtils';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { WordMasterTable } from '@/types/db';

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

  // 科目が指定されているので Query(GSI) で取得し、Scan を避ける
  const existing = await WordMasterService.listKanji(subject);
  const existingByQuestion = new Map(existing.map((x) => [x.question, x.wordId] as const));

  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  const errors: ImportKanjiResponse['errors'] = [];

  const createWordMasterOnly = async (params: { kanji: string; reading: string }): Promise<string> => {
    const id = createUuid();
    const dbItem: WordMasterTable = {
      wordId: id,
      question: params.kanji,
      answer: params.reading || '',
      subject,
    };
    await WordMasterService.create(dbItem);
    return id;
  };

  const processLine = async (index: number): Promise<void> => {
    const line = lines[index];
    try {
      const isPipeFormat = line.includes('|');
      const parsedPipe = isPipeFormat ? parsePipeLine(line) : null;
      const cols = isPipeFormat ? [] : line.split(/\t|,/).map((x) => x.trim());

      const kanji = parsedPipe?.kanji ?? cols[0];
      const reading = parsedPipe?.reading ?? cols[1] ?? '';
      const histories = parsedPipe?.histories ?? [];
      if (!kanji) {
        errorCount += 1;
        errors.push({ line: index + 1, content: line, reason: '問題が空です' });
        return;
      }

      const existingId = existingByQuestion.get(kanji);
      if (existingId) {
        // 重複時はスキップ（要件変更: UPDATE -> SKIP）
        duplicateCount += 1;
        return;
      }

      // 履歴がある行は、createKanji() の「初期候補作成」を避けて余計な書き込みを減らす
      if (histories.length > 0) {
        const wordId = await createWordMasterOnly({ kanji, reading });
        existingByQuestion.set(kanji, wordId);
        successCount += 1;
      } else {
        const created = await createKanji({ kanji, reading, subject });
        existingByQuestion.set(kanji, created.id);
        successCount += 1;
      }

      const targetWordId = existingByQuestion.get(kanji);
      if (!targetWordId) return;

      if (histories.length === 0) return;

      // 履歴を再構築するため既存候補を削除
      await ReviewTestCandidatesService.deleteCandidatesByTargetId({ subject, targetId: targetWordId });

      const sorted = [...histories].sort((a, b) => (a.submittedDate < b.submittedDate ? -1 : 1));
      const recent = sorted.slice(Math.max(0, sorted.length - 3));

      // 古い履歴は履歴としてのみ残す（状態計算には使わない）
      await Promise.all(
        sorted.slice(0, Math.max(0, sorted.length - 3)).map(async (h) => {
          await ReviewTestCandidatesService.createCandidate({
            subject,
            questionId: targetWordId,
            mode: 'KANJI',
            nextTime: h.submittedDate,
            correctCount: 0,
            status: 'CLOSED',
            createdAtIso: DateUtils.toIso(h.submittedDate),
          });
        }),
      );

      let streak = 0;
      let lastAttemptIso = '';
      let computedNextTime = '';
      let computedCorrectCount = 0;

      for (const h of recent) {
        const baseDateYmd = h.submittedDate;
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
          createdAtIso: DateUtils.toIso(h.submittedDate),
        });

        streak = computed.nextCorrectCount;
        lastAttemptIso = DateUtils.toIso(h.submittedDate);
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
    } catch (e) {
      errorCount += 1;
      errors.push({ line: index + 1, content: line, reason: e instanceof Error ? e.message : 'Unknown error' });
    }
  };

  const concurrency = Math.min(8, Math.max(1, Number(process.env.IMPORT_CONCURRENCY ?? 6)));
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, lines.length) }, async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= lines.length) break;
        await processLine(index);
      }
    }),
  );

  return {
    successCount,
    duplicateCount,
    errorCount,
    errors,
  };
};
