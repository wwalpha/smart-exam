import type {
  CreateKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
  Kanji,
  SearchKanjiRequest,
  SearchKanjiResponse,
  UpdateKanjiRequest,
} from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { WordMasterTable } from '@/types/db';
import type { Repositories } from '@/repositories/createRepositories';
import { parsePipeLine } from './importUtils';

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

    const q = (params.q ?? '').trim();
    const reading = (params.reading ?? '').trim();
    const subject = (params.subject ?? '').trim();

    const qLower = q.toLowerCase();
    const readingLower = reading.toLowerCase();
    const subjectLower = subject.toLowerCase();

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
    const updated = await repositories.wordMaster.update(id, {
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

  const importKanji: KanjiService['importKanji'] = async (data) => {
    const importType = data.importType ?? 'MASTER';

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
      .map((x) => x.replaceAll('　', ' ').trim())
      .filter((x) => x.length > 0);

    const questionIds: string[] = [];

    if (importType === 'QUESTIONS') {
      let successCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;
      const errors: ImportKanjiResponse['errors'] = [];

      const parsePromptAnswerLine = (line: string): { promptText: string; answerKanji: string } | null => {
        const first = line.indexOf('|');
        if (first < 0) return null;
        if (line.indexOf('|', first + 1) >= 0) return null;

        const promptText = line.slice(0, first).trim();
        const answerKanji = line.slice(first + 1).trim();
        if (!promptText) return null;
        if (!answerKanji) return null;
        return { promptText, answerKanji };
      };

      // 既存 word_master の読み込み（この用途では重複判定は promptText+answerKanji で雑に行う）
      const existing = await repositories.wordMaster.listKanji(subject);
      const existingKey = new Set(
        existing
          .map((x) => `${(x.promptText ?? '').trim()}|${(x.answerKanji ?? '').trim()}`)
          .filter((x) => x !== '|'),
      );
      const seenKey = new Set<string>();

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const parsed = parsePromptAnswerLine(line);
        if (!parsed) {
          errorCount += 1;
          errors.push({
            line: index + 1,
            content: line,
            reason: '形式が不正です（1行=「本文|答え漢字」、| は1つだけ）',
          });
          continue;
        }

        const key = `${parsed.promptText}|${parsed.answerKanji}`;
        if (existingKey.has(key) || seenKey.has(key)) {
          duplicateCount += 1;
          continue;
        }
        seenKey.add(key);

        const id = createUuid();
        const dbItem: WordMasterTable = {
          wordId: id,
          subject,

          // 互換のため既存必須属性は埋める（この機能では参照しない）
          question: parsed.answerKanji,
          answer: '',

          promptText: parsed.promptText,
          answerKanji: parsed.answerKanji,
          status: 'DRAFT',
        };

        await repositories.wordMaster.create(dbItem);

        successCount += 1;
        questionIds.push(id);
      }

      return {
        successCount,
        duplicateCount,
        errorCount,
        questionIds,
        errors,
      };
    }

    // 科目が指定されているので Query(GSI) で取得し、Scan を避ける
    const existing = await repositories.wordMaster.listKanji(subject);
    const existingByQuestion = new Map(existing.map((x) => [x.question, x.wordId] as const));

    // 同一ファイル内の重複（並列実行時の競合も含む）を防ぐ
    const seenQuestions = new Set<string>();

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
      await repositories.wordMaster.create(dbItem);
      questionIds.push(id);
      return id;
    };

    const processLine = async (index: number): Promise<void> => {
      const line = lines[index];
      try {
        const isPipeFormat = line.includes('|');
        const parsedPipe = isPipeFormat ? parsePipeLine(line) : null;
        const cols = isPipeFormat ? [] : line.split(/\t|,/).map((x) => x.trim());

        const kanjiRaw = parsedPipe?.kanji ?? cols[0];
        const kanji = (kanjiRaw ?? '').trim();
        const reading = parsedPipe?.reading ?? cols[1] ?? '';
        const histories = parsedPipe?.histories ?? [];
        if (!kanji) {
          errorCount += 1;
          errors.push({ line: index + 1, content: line, reason: '問題が空です' });
          return;
        }

        // 既存データ or 同一ファイル内で重複している場合はスキップ
        if (existingByQuestion.has(kanji) || seenQuestions.has(kanji)) {
          duplicateCount += 1;
          return;
        }

        // await を跨ぐ前に予約して、並列処理でも重複登録を防ぐ
        seenQuestions.add(kanji);

        // 履歴がある行は、createKanji() の「初期候補作成」を避けて余計な書き込みを減らす
        if (histories.length > 0) {
          const wordId = await createWordMasterOnly({ kanji, reading });
          existingByQuestion.set(kanji, wordId);
          successCount += 1;
        } else {
          const created = await createKanji({ kanji, reading, subject });
          existingByQuestion.set(kanji, created.id);
          successCount += 1;
          questionIds.push(created.id);
        }

        const targetWordId = existingByQuestion.get(kanji);
        if (!targetWordId) return;

        if (histories.length === 0) return;

        // 履歴を再構築するため既存候補を削除
        await repositories.reviewTestCandidates.deleteCandidatesByTargetId({ subject, targetId: targetWordId });

        const sorted = [...histories].sort((a, b) => (a.submittedDate < b.submittedDate ? -1 : 1));
        const recent = sorted.slice(Math.max(0, sorted.length - 3));

        // 古い履歴は履歴としてのみ残す（状態計算には使わない）
        await Promise.all(
          sorted.slice(0, Math.max(0, sorted.length - 3)).map(async (h) => {
            await repositories.reviewTestCandidates.createCandidate({
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
          await repositories.reviewTestCandidates.createCandidate({
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
          await repositories.reviewTestCandidates.createCandidate({
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
