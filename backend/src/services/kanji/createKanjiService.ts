import type {
  CreateKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
  Kanji,
  SearchKanjiRequest,
  SearchKanjiResponse,
  SubjectId,
  UpdateKanjiRequest,
} from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestCandidateTable, WordMasterTable } from '@/types/db';
import { parsePipeQuestionLine } from './importUtils';

export type KanjiService = {
  listKanji: () => Promise<Kanji[]>;
  searchKanji: (params: SearchKanjiRequest) => Promise<SearchKanjiResponse>;
  createKanji: (data: CreateKanjiRequest) => Promise<Kanji>;
  getKanji: (id: string) => Promise<Kanji | null>;
  updateKanji: (id: string, data: UpdateKanjiRequest) => Promise<Kanji | null>;
  deleteKanji: (id: string) => Promise<boolean>;
  deleteManyKanji: (ids: string[]) => Promise<void>;
  importKanji: (data: ImportKanjiRequest) => Promise<ImportKanjiResponse>;
};

export const createKanjiService = (repositories: Repositories): KanjiService => {
  const isHiraganaOnly = (s: string): boolean => {
    // ぁ-ゖ: ひらがな、ー: 長音記号
    return /^[ぁ-ゖー]+$/.test(s);
  };

  const buildValidator = (promptText: string) => {
    return (result: {
      readingHiragana: string;
      underlineSpec: { type: string; start: number; length: number };
    }) => {
      const readingHiragana = String(result.readingHiragana ?? '').trim();
      if (!readingHiragana) throw new Error('readingHiragana is empty');
      if (!isHiraganaOnly(readingHiragana)) throw new Error('readingHiragana must be hiragana only');

      const underlineSpec = result.underlineSpec;
      if (!underlineSpec || underlineSpec.type !== 'promptSpan') {
        throw new Error('underlineSpec.type must be promptSpan');
      }
      if (!Number.isInteger(underlineSpec.start) || !Number.isInteger(underlineSpec.length)) {
        throw new Error('underlineSpec.start/length must be int');
      }
      if (underlineSpec.start < 0 || underlineSpec.length <= 0) {
        throw new Error('underlineSpec.start/length out of range');
      }
      if (underlineSpec.start + underlineSpec.length > promptText.length) {
        throw new Error('underlineSpec out of promptText range');
      }

      const slice = promptText.slice(underlineSpec.start, underlineSpec.start + underlineSpec.length);
      if (slice !== readingHiragana) {
        throw new Error('underlineSpec does not match readingHiragana');
      }

      return {
        readingHiragana,
        underlineSpec: { type: 'promptSpan' as const, start: underlineSpec.start, length: underlineSpec.length },
      };
    };
  };

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

  const listKanji: KanjiService['listKanji'] = async () => {
    const items = await repositories.wordMaster.listKanji();
    return items.map((dbItem) => ({
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    }));
  };

  const searchKanji: KanjiService['searchKanji'] = async (params) => {
    const items = await listKanji();

    const qLower = (params.q ?? '').trim().toLowerCase();
    const readingLower = (params.reading ?? '').trim().toLowerCase();
    const subjectLower = (params.subject ?? '').trim().toLowerCase();

    const filtered = items.filter((x) => {
      if (
        qLower &&
        !String(x.kanji ?? '')
          .toLowerCase()
          .includes(qLower)
      )
        return false;
      if (
        readingLower &&
        !String(x.reading ?? '')
          .toLowerCase()
          .includes(readingLower)
      )
        return false;
      if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
      return true;
    });

    return { items: filtered, total: filtered.length };
  };

  const createKanji: KanjiService['createKanji'] = async (data) => {
    const id = createUuid();

    const item: Kanji = { id, ...data };

    const dbItem: WordMasterTable = {
      wordId: id,
      question: data.kanji,
      answer: data.reading || '',
      subject: data.subject,
    };

    await repositories.wordMaster.create(dbItem);

    // 候補を作成（新規作成時はOPEN）
    await repositories.reviewTestCandidates.createCandidate({
      subject: data.subject,
      questionId: id,
      mode: 'KANJI',
      nextTime: DateUtils.todayYmd(),
      correctCount: 0,
      status: 'OPEN',
      createdAtIso: DateUtils.now(),
    });

    return item;
  };

  const getKanji: KanjiService['getKanji'] = async (id) => {
    const dbItem = await repositories.wordMaster.get(id);
    if (!dbItem) return null;
    return {
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    };
  };

  const updateKanji: KanjiService['updateKanji'] = async (id, data) => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) return null;

    const nextQuestion = data.kanji !== undefined ? data.kanji : String(existing.question ?? '');
    const nextAnswer = data.reading !== undefined ? data.reading : String(existing.answer ?? '');

    const shouldRegenerateKanjiQuestionFields =
      (data.kanji !== undefined || data.reading !== undefined) &&
      Boolean(existing.readingHiragana || existing.underlineSpec);

    const kanjiQuestionFields = shouldRegenerateKanjiQuestionFields
      ? (() => {
          const question = String(nextQuestion ?? '').trim();
          const answer = String(nextAnswer ?? '').trim();
          if (!question || !answer) {
            throw new Error('question/answer is missing');
          }
          return { question, answer };
        })()
      : null;

    const regenerated = shouldRegenerateKanjiQuestionFields
      ? await (async () => {
          const bulk = await repositories.bedrock.generateKanjiQuestionReadingsBulk({
            items: [{ id, question: kanjiQuestionFields!.question, answer: kanjiQuestionFields!.answer }],
          });
          const raw = bulk.items.find((x) => x.id === id);
          if (!raw) throw new Error('読み生成に失敗しました: 結果が返りませんでした');

          const validate = buildValidator(kanjiQuestionFields!.question);
          const readingHiragana = String(raw.readingHiragana ?? '').trim();
          const startIndex = kanjiQuestionFields!.question.indexOf(readingHiragana);
          if (startIndex < 0) {
            throw new Error('readingHiragana is not found in question');
          }

          const validated = validate({
            readingHiragana,
            underlineSpec: { type: 'promptSpan', start: startIndex, length: readingHiragana.length },
          });
          return {
            readingHiragana: validated.readingHiragana,
            underlineSpec: validated.underlineSpec,
          };
        })()
      : null;

    const updated = await repositories.wordMaster.update(id, {
      ...(data.kanji !== undefined ? { question: data.kanji } : {}),
      ...(data.reading !== undefined ? { answer: data.reading } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(regenerated ? { readingHiragana: regenerated.readingHiragana, underlineSpec: regenerated.underlineSpec } : {}),
    });
    if (!updated) return null;
    return {
      id: updated.wordId,
      kanji: updated.question,
      reading: updated.answer,
      subject: updated.subject,
    };
  };

  const deleteKanji: KanjiService['deleteKanji'] = async (id) => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) return false;

    await repositories.reviewTestCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
    await repositories.wordMaster.delete(id);
    return true;
  };

  const deleteManyKanji: KanjiService['deleteManyKanji'] = async (ids) => {
    const uniqueIds = Array.from(new Set(ids.map((x) => x.trim()).filter((x) => x.length > 0)));
    for (const id of uniqueIds) {
      const existing = await repositories.wordMaster.get(id);
      if (!existing) continue;

      await repositories.reviewTestCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
      await repositories.wordMaster.delete(id);
    }
  };

  // NOTE: 形式は1種類のみ（本文|答え漢字|履歴...）。旧MASTER処理は廃止。
  const importKanji: KanjiService['importKanji'] = async (data) => {
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
      existing.map((x) => `${String(x.question ?? '').trim()}|${String(x.answer ?? '').trim()}`).filter((x) => x !== '|'),
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
          errors.push({ line: row.lineNumber, content: row.content, reason: '読み生成に失敗しました: 結果が返りませんでした' });
          continue;
        }

        try {
          const validate = buildValidator(row.question);
          const readingHiragana = String(raw.readingHiragana ?? '').trim();
          const startIndex = row.question.indexOf(readingHiragana);
          if (startIndex < 0) {
            throw new Error('readingHiragana is not found in question');
          }
          const validated = validate({
            readingHiragana,
            underlineSpec: { type: 'promptSpan', start: startIndex, length: readingHiragana.length },
          });

          wordMasterItems.push({
            wordId: row.wordId,
            subject,
            question: row.question,
            answer: row.answer,
            readingHiragana: validated.readingHiragana,
            underlineSpec: validated.underlineSpec,
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
          await repositories.reviewTestCandidates.deleteCandidatesByTargetId({ subject: t.subject, targetId: t.targetId });
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

  return {
    listKanji,
    searchKanji,
    createKanji,
    getKanji,
    updateKanji,
    deleteKanji,
    deleteManyKanji,
    importKanji,
  };
};
