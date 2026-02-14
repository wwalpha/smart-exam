import type { ImportKanjiResponse, SubjectId } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestCandidateTable, WordMasterTable } from '@/types/db';

import { computeKanjiQuestionFields } from './computeKanjiQuestionFields';
import type { KanjiService } from './createKanjiService';
import { parsePipeQuestionLine } from './importUtils';

export const createImportKanji = (repositories: Repositories): KanjiService['importKanji'] => {
  const buildCandidateRow = (params: {
    subject: SubjectId;
    questionId: string;
    mode: 'KANJI';
    nextTime: string;
    correctCount: number;
    status: 'OPEN' | 'CLOSED' | 'EXCLUDED';
    createdAtIso?: string;
  }): ReviewTestCandidateTable => {
    const id = createUuid();
    const createdAt = params.createdAtIso ?? DateUtils.now();
    return {
      subject: params.subject,
      candidateKey: `${params.nextTime}#${id}`,
      id,
      questionId: params.questionId,
      mode: params.mode,
      status: params.status,
      correctCount: Math.max(0, Math.trunc(params.correctCount)),
      nextTime: params.nextTime,
      createdAt,
    };
  };

  const buildCandidatesFromHistories = (params: {
    subject: SubjectId;
    targetWordId: string;
    histories: { submittedDate: string; isCorrect: boolean }[];
    finalStatus: 'AUTO' | 'EXCLUDED';
  }): ReviewTestCandidateTable[] => {
    if (params.histories.length === 0) return [];

    const sorted = [...params.histories].sort((a, b) => (a.submittedDate < b.submittedDate ? -1 : 1));
    const recent = sorted.slice(Math.max(0, sorted.length - 3));

    const candidates: ReviewTestCandidateTable[] = [];

    // 古い履歴は履歴としてのみ残す（状態計算には使わない）
    for (const h of sorted.slice(0, Math.max(0, sorted.length - 3))) {
      candidates.push(
        buildCandidateRow({
          subject: params.subject,
          questionId: params.targetWordId,
          mode: 'KANJI',
          nextTime: h.submittedDate,
          correctCount: 0,
          status: 'CLOSED',
          createdAtIso: DateUtils.toIso(h.submittedDate),
        }),
      );
    }

    let streak = 0;
    let lastAttemptIso = '';
    let computedNextTime = '';
    let computedCorrectCount = 0;

    for (const h of recent) {
      const computed = ReviewNextTime.compute({
        mode: 'KANJI',
        baseDateYmd: h.submittedDate,
        isCorrect: h.isCorrect,
        currentCorrectCount: streak,
      });

      // 直近3回の履歴は、次状態を含めて履歴として残す
      candidates.push(
        buildCandidateRow({
          subject: params.subject,
          questionId: params.targetWordId,
          mode: 'KANJI',
          nextTime: computed.nextTime,
          correctCount: computed.nextCorrectCount,
          status: 'CLOSED',
          createdAtIso: DateUtils.toIso(h.submittedDate),
        }),
      );

      streak = computed.nextCorrectCount;
      lastAttemptIso = DateUtils.toIso(h.submittedDate);
      computedNextTime = computed.nextTime;
      computedCorrectCount = computed.nextCorrectCount;
    }

    if (!computedNextTime || !lastAttemptIso) return candidates;

    const finalStatus =
      params.finalStatus === 'EXCLUDED'
        ? 'EXCLUDED'
        : computedNextTime === ReviewNextTime.EXCLUDED_NEXT_TIME
          ? 'EXCLUDED'
          : 'OPEN';

    candidates.push(
      buildCandidateRow({
        subject: params.subject,
        questionId: params.targetWordId,
        mode: 'KANJI',
        nextTime: computedNextTime,
        correctCount: computedCorrectCount,
        status: finalStatus,
        createdAtIso: lastAttemptIso,
      }),
    );

    return candidates;
  };

  return async (data): Promise<ImportKanjiResponse> => {
    const subject = data.subject;

    const lines = data.fileContent
      .split(/\r?\n/)
      .map((x) => x.replaceAll('　', ' ').trim())
      .filter((x) => x.length > 0);

    const questionIds: string[] = [];

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: ImportKanjiResponse['errors'] = [];

    const formatErrorReason = '形式が不正です（1行=「本文|答え漢字|YYYY-MM-DD,OK|...」）';

    const existing = (await repositories.wordMaster.listKanji(subject)).filter((x) => Boolean(x.underlineSpec));
    const existingKey = new Set(
      existing
        .map((x) => `${String(x.question ?? '').trim()}|${String(x.answer ?? '').trim()}`)
        .filter((x) => x !== '|'),
    );
    const seenKey = new Set<string>();

    const validRows: Array<{
      lineNumber: number;
      content: string;
      question: string;
      answer: string;
      histories: { submittedDate: string; isCorrect: boolean }[];
      wordId: string;
    }> = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      if (!line.includes('|')) {
        errorCount += 1;
        errors.push({ line: index + 1, content: line, reason: formatErrorReason });
        continue;
      }

      let parsed: {
        question: string;
        answer: string;
        histories: { submittedDate: string; isCorrect: boolean }[];
      };
      try {
        parsed = parsePipeQuestionLine(line);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        errorCount += 1;
        errors.push({
          line: index + 1,
          content: line,
          reason: message === 'フォーマットが不正です' ? formatErrorReason : message,
        });
        continue;
      }

      const question = parsed.question.trim();
      const answer = parsed.answer.trim();
      if (!question) {
        errorCount += 1;
        errors.push({ line: index + 1, content: line, reason: '本文が空です' });
        continue;
      }
      if (!answer) {
        errorCount += 1;
        errors.push({ line: index + 1, content: line, reason: '答え漢字が空です' });
        continue;
      }

      const key = `${question}|${answer}`;
      if (existingKey.has(key) || seenKey.has(key)) {
        duplicateCount += 1;
        continue;
      }
      seenKey.add(key);

      validRows.push({
        lineNumber: index + 1,
        content: line,
        question,
        answer,
        histories: parsed.histories,
        wordId: createUuid(),
      });
    }

    const wordMasterItems: WordMasterTable[] = [];
    const candidatesToCreate: ReviewTestCandidateTable[] = [];
    const candidateTargetsToDelete: Array<{ subject: SubjectId; targetId: string }> = [];

    const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';
    const batchSize = 100;
    for (let start = 0; start < validRows.length; start += batchSize) {
      const batch = validRows.slice(start, start + batchSize);

      let bulkGenerated: { items: Array<{ id: string; readingHiragana: string }> };
      try {
        bulkGenerated = await repositories.bedrock.generateKanjiQuestionReadingsBulk({
          items: batch.map((r) => ({ id: r.wordId, question: r.question, answer: r.answer })),
          modelId,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        for (const row of batch) {
          errorCount += 1;
          errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
        }
        continue;
      }

      const byId = new Map(bulkGenerated.items.map((x) => [String(x.id ?? ''), x] as const));
      for (const row of batch) {
        const raw = byId.get(row.wordId);
        if (!raw) {
          errorCount += 1;
          errors.push({
            line: row.lineNumber,
            content: row.content,
            reason: '読み生成に失敗しました: 結果が返りませんでした',
          });
          continue;
        }

        try {
          const computed = computeKanjiQuestionFields({
            question: row.question,
            readingHiragana: String(raw.readingHiragana ?? '').trim(),
          });

          wordMasterItems.push({
            wordId: row.wordId,
            subject,
            question: row.question,
            answer: row.answer,
            readingHiragana: computed.readingHiragana,
            underlineSpec: computed.underlineSpec,
          });

          if (row.histories.length > 0) {
            candidateTargetsToDelete.push({ subject, targetId: row.wordId });
            candidatesToCreate.push(
              ...buildCandidatesFromHistories({
                subject,
                targetWordId: row.wordId,
                histories: row.histories,
                finalStatus: 'AUTO',
              }),
            );
          } else {
            candidatesToCreate.push(
              buildCandidateRow({
                subject,
                questionId: row.wordId,
                mode: 'KANJI',
                nextTime: DateUtils.todayYmd(),
                correctCount: 0,
                status: 'OPEN',
                createdAtIso: DateUtils.now(),
              }),
            );
          }

          successCount += 1;
          questionIds.push(row.wordId);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          errorCount += 1;
          errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
          continue;
        }
      }
    }

    await repositories.wordMaster.bulkCreate(wordMasterItems);

    if (candidateTargetsToDelete.length > 0) {
      await Promise.all(
        candidateTargetsToDelete.map(async (t) => {
          await repositories.reviewTestCandidates.deleteCandidatesByTargetId({
            subject: t.subject,
            targetId: t.targetId,
          });
        }),
      );
    }
    await repositories.reviewTestCandidates.bulkCreateCandidates(candidatesToCreate);

    return {
      successCount,
      duplicateCount,
      errorCount,
      questionIds,
      errors,
    };
  };
};
