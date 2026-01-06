import { dbHelper } from '@/lib/aws';
import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import { MaterialsService } from '@/services/MaterialsService';
import { QuestionsService } from '@/services/QuestionsService';
import { WordsService } from '@/services/WordsService';
import type { CreateReviewTestRequest, ReviewTest } from '@smart-exam/api-types';
import type { MaterialQuestionTable, ReviewTestItemEmbedded, ReviewTestTable, WordMasterTable } from '@/types/db';
import { putCandidate } from './putCandidate';
import {
  computeDueDate,
  isWithinRange,
  parseFilterRange,
  ReviewCandidate,
  TABLE_REVIEW_TESTS,
  targetKeyOf,
  toApiReviewTest,
} from './internal';

export const createReviewTest = async (req: CreateReviewTestRequest): Promise<ReviewTest> => {
  const testId = createUuid();
  const createdDate = DateUtils.todayYmd();
  const range = parseFilterRange(req);

  const candidates: ReviewCandidate[] = [];

  if (req.mode === 'KANJI') {
    const words = await WordsService.listKanji(req.subject);
    for (const w of words as WordMasterTable[]) {
      const registeredDate = createdDate;
      const { dueDate, lastAttemptDate } = computeDueDate({ targetType: 'KANJI', registeredDate });

      if (dueDate === null) continue;
      if (!isWithinRange(lastAttemptDate, range)) continue;

      candidates.push({
        targetType: 'KANJI',
        targetId: w.wordId,
        subject: w.subject,
        registeredDate,
        dueDate,
        lastAttemptDate,
      });
    }
  } else {
    const questions = await QuestionsService.scanAll();
    for (const q of questions as MaterialQuestionTable[]) {
      if (String(q.subjectId) !== String(req.subject)) continue;

      const registeredDate = createdDate;
      const { dueDate, lastAttemptDate } = computeDueDate({ targetType: 'QUESTION', registeredDate });

      if (dueDate === null) continue;
      if (!isWithinRange(lastAttemptDate, range)) continue;

      candidates.push({
        targetType: 'QUESTION',
        targetId: q.questionId,
        subject: q.subjectId,
        registeredDate,
        dueDate,
        lastAttemptDate,
      });
    }
  }

  // 要件 8.3: dueDate asc -> lastAttemptDate asc -> ID asc (deterministic)
  candidates.sort((a, b) => {
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
    if (a.lastAttemptDate !== b.lastAttemptDate) return a.lastAttemptDate < b.lastAttemptDate ? -1 : 1;
    if (a.targetId !== b.targetId) return a.targetId < b.targetId ? -1 : 1;
    return a.targetType < b.targetType ? -1 : a.targetType > b.targetType ? 1 : 0;
  });

  const selected: ReviewCandidate[] = [];
  for (const c of candidates) {
    if (selected.length >= req.count) break;

    const dueDate = c.dueDate;
    if (!dueDate) continue;

    try {
      await putCandidate({
        subject: c.subject as any,
        questionId: c.targetId,
        mode: req.mode,
        nextTime: dueDate,
        testId,
      });
      selected.push(c);
    } catch (e: unknown) {
      // 既に別テストに紐付いている候補はスキップする
      const name = (e as { name?: string } | null)?.name;
      if (name === 'ConditionalCheckFailedException') continue;
      throw e;
    }
  }

  const questions = selected.map((c) => c.targetId);

  const testRow: ReviewTestTable = {
    testId,
    subject: req.subject,
    mode: req.mode,
    status: 'IN_PROGRESS',
    count: selected.length,
    questions,
    createdDate,
    pdfS3Key: `review-tests/${testId}.pdf`,
  };

  const embeddedItems: ReviewTestItemEmbedded[] = [];
  if (req.mode === 'KANJI') {
    const words = await WordsService.listKanji(req.subject);
    const byId = new Map((words as WordMasterTable[]).map((w) => [w.wordId, w] as const));

    selected.forEach((c, index) => {
      const w = byId.get(c.targetId);
      embeddedItems.push({
        itemKey: `${c.targetType}#${c.targetId}`,
        order: index + 1,
        targetType: 'KANJI',
        targetId: c.targetId,
        targetKey: targetKeyOf('KANJI', c.targetId),
        kanji: w?.question,
        reading: w?.answer,
        questionText: w?.question,
        answerText: w?.answer,
      });
    });
  } else {
    const [questions, materials] = await Promise.all([QuestionsService.scanAll(), MaterialsService.list()]);
    const qById = new Map((questions as MaterialQuestionTable[]).map((q) => [q.questionId, q] as const));
    const mById = new Map(materials.map((m) => [m.materialId, m] as const));

    selected.forEach((c, index) => {
      const q = qById.get(c.targetId);
      const m = q ? mById.get(q.materialId) : undefined;
      embeddedItems.push({
        itemKey: `${c.targetType}#${c.targetId}`,
        order: index + 1,
        targetType: 'QUESTION',
        targetId: c.targetId,
        targetKey: targetKeyOf('QUESTION', c.targetId),
        displayLabel: q?.canonicalKey,
        canonicalKey: q?.canonicalKey,
        materialSetName: m?.title,
        materialSetDate: m?.date,
        questionText: q?.canonicalKey,
      });
    });
  }

  const storedRow: ReviewTestTable = {
    ...testRow,
    items: embeddedItems,
    results: [],
  };

  await dbHelper.put({ TableName: TABLE_REVIEW_TESTS, Item: storedRow });

  return toApiReviewTest(storedRow);
};
