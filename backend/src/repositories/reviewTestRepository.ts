import { dbHelper } from '@/lib/aws';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import { QuestionsService } from '@/services/QuestionsService';
import { TestsService } from '@/services/TestsService';
import { WordsService } from '@/services/WordsService';
import type {
  CreateReviewTestRequest,
  ReviewTest,
  ReviewTestDetail,
  ReviewTestItem,
  ReviewTestTarget,
  SubmitReviewTestResultsRequest,
  UpdateReviewTestStatusRequest,
} from '@smart-exam/api-types';
import type {
  QuestionTable,
  ReviewAttemptTable,
  ReviewLockTable,
  ReviewTestItemTable,
  ReviewTestTable,
  WordTable,
} from '@/types/db';

const TABLE_REVIEW_TESTS = ENV.TABLE_REVIEW_TESTS;
const TABLE_REVIEW_TEST_ITEMS = ENV.TABLE_REVIEW_TEST_ITEMS;
const TABLE_REVIEW_LOCKS = ENV.TABLE_REVIEW_LOCKS;
const TABLE_REVIEW_ATTEMPTS = ENV.TABLE_REVIEW_ATTEMPTS;

type ReviewTargetType = 'QUESTION' | 'KANJI';

type ReviewCandidate = {
  targetType: ReviewTargetType;
  targetId: string;
  subject: string;
  registeredDate: string;
  dueDate: string | null;
  lastAttemptDate: string;
};

const targetKeyOf = (targetType: ReviewTargetType, targetId: string): string => `${targetType}#${targetId}`;

const toIsoAtStartOfDay = (ymd: string): string => {
  return DateUtils.format(`${ymd}T00:00:00`);
};

const parseFilterRange = (req: CreateReviewTestRequest): { fromYmd?: string; toYmd?: string } => {
  if (typeof req.days === 'number' && req.days > 0) {
    const today = DateUtils.todayYmd();
    const from = DateUtils.addDaysYmd(today, -1 * (req.days - 1));
    return { fromYmd: from, toYmd: today };
  }

  const fromYmd = req.rangeFrom ? DateUtils.toYmd(req.rangeFrom) : undefined;
  const toYmd = req.rangeTo ? DateUtils.toYmd(req.rangeTo) : undefined;
  return { fromYmd, toYmd };
};

const isWithinRange = (ymd: string, range: { fromYmd?: string; toYmd?: string }): boolean => {
  if (range.fromYmd && ymd < range.fromYmd) return false;
  if (range.toYmd && ymd > range.toYmd) return false;
  return true;
};

const listAttemptsForTarget = async (targetKey: string): Promise<ReviewAttemptTable[]> => {
  const result = await dbHelper.query<ReviewAttemptTable>({
    TableName: TABLE_REVIEW_ATTEMPTS,
    KeyConditionExpression: '#targetKey = :targetKey',
    ExpressionAttributeNames: { '#targetKey': 'targetKey' },
    ExpressionAttributeValues: { ':targetKey': targetKey },
    ScanIndexForward: false,
  });
  return result.Items ?? [];
};

const calcStreakAndLastDates = (
  attempts: ReviewAttemptTable[]
): {
  latestState: 'CORRECT' | 'INCORRECT' | null;
  streak: number;
  lastCorrectDate: string | null;
  lastIncorrectDate: string | null;
  lastAttemptDate: string | null;
} => {
  if (attempts.length === 0) {
    return {
      latestState: null,
      streak: 0,
      lastCorrectDate: null,
      lastIncorrectDate: null,
      lastAttemptDate: null,
    };
  }

  const lastAttemptDate = DateUtils.toYmd(attempts[0].attemptedAt);

  let lastCorrectDate: string | null = null;
  let lastIncorrectDate: string | null = null;

  for (const a of attempts) {
    const ymd = DateUtils.toYmd(a.attemptedAt);
    if (a.state === 'CORRECT' && !lastCorrectDate) lastCorrectDate = ymd;
    if (a.state === 'INCORRECT' && !lastIncorrectDate) lastIncorrectDate = ymd;
    if (lastCorrectDate && lastIncorrectDate) break;
  }

  const latestState = attempts[0].state;

  let streak = 0;
  if (latestState === 'CORRECT') {
    for (const a of attempts) {
      if (a.state !== 'CORRECT') break;
      streak += 1;
      if (streak >= 3) break;
    }
  }

  return { latestState, streak, lastCorrectDate, lastIncorrectDate, lastAttemptDate };
};

const computeDueDate = (params: {
  targetType: ReviewTargetType;
  registeredDate: string;
  attempts: ReviewAttemptTable[];
}): { dueDate: string | null; lastAttemptDate: string } => {
  const { targetType, registeredDate, attempts } = params;

  const { latestState, streak, lastCorrectDate, lastIncorrectDate, lastAttemptDate } = calcStreakAndLastDates(attempts);
  const lastAttempt = lastAttemptDate ?? registeredDate;

  // 3連続正解: 将来日に送る (2099-12-31)
  if (streak >= 3) {
    return { dueDate: '2099-12-31', lastAttemptDate: lastAttempt };
  }

  if (targetType === 'QUESTION') {
    if (latestState === 'INCORRECT') {
      return {
        dueDate: DateUtils.addDaysYmd(lastIncorrectDate ?? lastAttempt, 30),
        lastAttemptDate: lastAttempt,
      };
    }

    if (latestState === 'CORRECT') {
      return {
        dueDate: DateUtils.addDaysYmd(lastCorrectDate ?? lastAttempt, 90),
        lastAttemptDate: lastAttempt,
      };
    }

    // 履歴なし（未実施のみ）：登録日 + 0日
    return { dueDate: registeredDate, lastAttemptDate: registeredDate };
  }

  // KANJI
  if (latestState === null) {
    return { dueDate: DateUtils.addDaysYmd(registeredDate, 7), lastAttemptDate: registeredDate };
  }

  if (latestState === 'INCORRECT') {
    return {
      dueDate: DateUtils.addDaysYmd(lastIncorrectDate ?? lastAttempt, 1),
      lastAttemptDate: lastAttempt,
    };
  }

  // latestState === 'CORRECT'
  if (streak === 2) {
    return {
      dueDate: DateUtils.addDaysYmd(lastCorrectDate ?? lastAttempt, 90),
      lastAttemptDate: lastAttempt,
    };
  }

  // streak === 1
  return {
    dueDate: DateUtils.addDaysYmd(lastCorrectDate ?? lastAttempt, 30),
    lastAttemptDate: lastAttempt,
  };
};

const tryLock = async (params: {
  targetType: ReviewTargetType;
  targetId: string;
  testId: string;
}): Promise<boolean> => {
  const targetKey = targetKeyOf(params.targetType, params.targetId);

  const item: ReviewLockTable = {
    targetKey,
    testId: params.testId,
    targetType: params.targetType,
    targetId: params.targetId,
  };

  try {
    await dbHelper.put({
      TableName: TABLE_REVIEW_LOCKS,
      Item: item,
      ConditionExpression: 'attribute_not_exists(#targetKey)',
      ExpressionAttributeNames: { '#targetKey': 'targetKey' },
    });
    return true;
  } catch (e) {
    const name = e && typeof e === 'object' && 'name' in e ? String((e as any).name) : '';
    if (name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw e;
  }
};

const releaseLock = async (targetType: ReviewTargetType, targetId: string): Promise<void> => {
  const targetKey = targetKeyOf(targetType, targetId);
  await dbHelper.delete({ TableName: TABLE_REVIEW_LOCKS, Key: { targetKey } });
};

const getReviewTestRow = async (testId: string): Promise<ReviewTestTable | null> => {
  const result = await dbHelper.get<ReviewTestTable>({ TableName: TABLE_REVIEW_TESTS, Key: { testId } });
  return result?.Item ?? null;
};

const listReviewTestItemRows = async (testId: string): Promise<ReviewTestItemTable[]> => {
  const result = await dbHelper.query<ReviewTestItemTable>({
    TableName: TABLE_REVIEW_TEST_ITEMS,
    KeyConditionExpression: '#testId = :testId',
    ExpressionAttributeNames: { '#testId': 'testId' },
    ExpressionAttributeValues: { ':testId': testId },
  });
  return result.Items ?? [];
};

const putReviewTestItems = async (items: ReviewTestItemTable[]): Promise<void> => {
  for (const item of items) {
    await dbHelper.put({ TableName: TABLE_REVIEW_TEST_ITEMS, Item: item });
  }
};

const updateReviewItemGrading = async (params: {
  testId: string;
  itemKey: string;
  isCorrect: boolean;
}): Promise<void> => {
  await dbHelper.update({
    TableName: TABLE_REVIEW_TEST_ITEMS,
    Key: { testId: params.testId, itemKey: params.itemKey },
    UpdateExpression: 'SET #isCorrect = :isCorrect',
    ExpressionAttributeNames: { '#isCorrect': 'isCorrect' },
    ExpressionAttributeValues: { ':isCorrect': params.isCorrect },
  });
};

const toApiReviewTest = (row: ReviewTestTable): ReviewTest => ({
  id: row.testId,
  testId: row.testId,
  subject: row.subject,
  mode: row.mode,
  createdDate: row.createdDate,
  createdAt: row.createdAt ?? DateUtils.format(`${row.createdDate}T00:00:00+09:00`),
  status: row.status === 'CANCELED' ? 'IN_PROGRESS' : row.status,
  pdf: {
    url: `/api/review-tests/${row.testId}/pdf`,
    downloadUrl: `/api/review-tests/${row.testId}/pdf?download=1`,
  },
  itemCount: row.generatedCount,
});

const toApiReviewTestItem = (row: ReviewTestItemTable): ReviewTestItem => ({
  id: row.itemKey,
  itemId: row.targetId,
  testId: row.testId,
  targetType: row.targetType,
  targetId: row.targetId,
  displayLabel: row.displayLabel,
  canonicalKey: row.canonicalKey,
  kanji: row.kanji,
  materialSetName: row.materialSetName,
  materialSetDate: row.materialSetDate,
  questionText: row.questionText,
  answerText: row.answerText,
  ...(row.isCorrect !== undefined ? { isCorrect: row.isCorrect } : {}),
});

export const ReviewTestRepository = {
  listReviewTests: async (): Promise<ReviewTest[]> => {
    const result = await dbHelper.scan<ReviewTestTable>({ TableName: TABLE_REVIEW_TESTS });
    const items = result.Items ?? [];

    // stable ordering: createdDate desc then testId desc
    items.sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      return a.testId < b.testId ? 1 : -1;
    });

    return items.map(toApiReviewTest);
  },

  listReviewTestTargets: async (params: {
    mode: 'QUESTION' | 'KANJI';
    fromYmd: string;
    toYmd: string;
    subject?: string;
  }): Promise<ReviewTestTarget[]> => {
    const tests = await ReviewTestRepository.listReviewTests();

    const from = params.fromYmd;
    const to = params.toYmd;

    const filteredTests = tests.filter((t) => {
      if (t.mode !== params.mode) return false;
      if (params.subject && t.subject !== (params.subject as any)) return false;
      if (t.createdDate < from) return false;
      if (t.createdDate > to) return false;
      return true;
    });

    const byKey = new Map<string, ReviewTestTarget>();

    for (const t of filteredTests) {
      const rows = await listReviewTestItemRows(t.testId);
      for (const r of rows) {
        // safety: keep only items that match requested mode
        if (r.targetType !== params.mode) continue;

        const key = `${t.subject}#${r.targetId}`;
        const current = byKey.get(key);

        const reading = (r as any).reading ?? r.answerText;

        if (!current) {
          byKey.set(key, {
            targetType: r.targetType,
            targetId: r.targetId,
            subject: t.subject as any,
            displayLabel: r.displayLabel,
            canonicalKey: r.canonicalKey,
            kanji: r.kanji,
            reading,
            materialSetName: r.materialSetName,
            materialSetDate: r.materialSetDate,
            questionText: r.questionText,
            lastTestCreatedDate: t.createdDate,
            includedCount: 1,
          });
          continue;
        }

        const nextLast = current.lastTestCreatedDate < t.createdDate ? t.createdDate : current.lastTestCreatedDate;

        byKey.set(key, {
          ...current,
          displayLabel: current.displayLabel ?? r.displayLabel,
          canonicalKey: current.canonicalKey ?? r.canonicalKey,
          kanji: current.kanji ?? r.kanji,
          reading: current.reading ?? reading,
          materialSetName: current.materialSetName ?? r.materialSetName,
          materialSetDate: current.materialSetDate ?? r.materialSetDate,
          questionText: current.questionText ?? r.questionText,
          lastTestCreatedDate: nextLast,
          includedCount: (current.includedCount ?? 0) + 1,
        });
      }
    }

    const items = Array.from(byKey.values());
    items.sort((a, b) => {
      if (a.lastTestCreatedDate !== b.lastTestCreatedDate) {
        return a.lastTestCreatedDate < b.lastTestCreatedDate ? 1 : -1;
      }
      if (a.subject !== b.subject) return String(a.subject) < String(b.subject) ? -1 : 1;

      const aKey = a.canonicalKey ?? a.kanji ?? a.targetId;
      const bKey = b.canonicalKey ?? b.kanji ?? b.targetId;
      if (aKey !== bKey) return aKey < bKey ? -1 : 1;
      return a.targetId < b.targetId ? -1 : a.targetId > b.targetId ? 1 : 0;
    });

    return items;
  },

  createReviewTest: async (req: CreateReviewTestRequest): Promise<ReviewTest> => {
    const testId = createUuid();
    const createdDate = DateUtils.todayYmd();
    const createdAt = DateUtils.now();
    const range = parseFilterRange(req);

    const candidates: ReviewCandidate[] = [];

    if (req.mode === 'KANJI') {
      const words = await WordsService.listKanji(req.subject);
      for (const w of words as WordTable[]) {
        const registeredDate = w.registeredDate ?? DateUtils.todayYmd();
        const targetKey = targetKeyOf('KANJI', w.wordId);
        const attempts = await listAttemptsForTarget(targetKey);
        const { dueDate, lastAttemptDate } = computeDueDate({
          targetType: 'KANJI',
          registeredDate,
          attempts,
        });

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
      for (const q of questions as QuestionTable[]) {
        if (String(q.subjectId) !== String(req.subject)) continue;

        const registeredDate = q.registeredDate ?? DateUtils.todayYmd();
        const targetKey = targetKeyOf('QUESTION', q.questionId);
        const attempts = await listAttemptsForTarget(targetKey);
        const { dueDate, lastAttemptDate } = computeDueDate({
          targetType: 'QUESTION',
          registeredDate,
          attempts,
        });

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

      const locked = await tryLock({ targetType: c.targetType, targetId: c.targetId, testId });
      if (!locked) continue;

      selected.push(c);
    }

    const testRow: ReviewTestTable = {
      testId,
      subject: req.subject,
      mode: req.mode,
      status: 'IN_PROGRESS',
      requestedCount: req.count,
      generatedCount: selected.length,
      createdAt,
      createdDate,
    };

    await dbHelper.put({ TableName: TABLE_REVIEW_TESTS, Item: testRow });

    // Build items snapshot
    const itemRows: ReviewTestItemTable[] = [];
    if (req.mode === 'KANJI') {
      const words = await WordsService.listKanji(req.subject);
      const byId = new Map((words as WordTable[]).map((w) => [w.wordId, w] as const));

      selected.forEach((c, index) => {
        const w = byId.get(c.targetId);
        itemRows.push({
          testId,
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
      const [questions, materialSets] = await Promise.all([QuestionsService.scanAll(), TestsService.list()]);
      const qById = new Map((questions as QuestionTable[]).map((q) => [q.questionId, q] as const));
      const mById = new Map(materialSets.map((m) => [m.testId, m] as const));

      selected.forEach((c, index) => {
        const q = qById.get(c.targetId);
        const m = q ? mById.get(q.testId) : undefined;
        itemRows.push({
          testId,
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

    await putReviewTestItems(itemRows);

    return toApiReviewTest(testRow);
  },

  getReviewTest: async (testId: string): Promise<ReviewTestDetail | null> => {
    const test = await getReviewTestRow(testId);
    if (!test) return null;

    const itemRows = await listReviewTestItemRows(testId);
    itemRows.sort((a, b) => a.order - b.order);

    return {
      ...toApiReviewTest(test),
      items: itemRows.map(toApiReviewTestItem),
    };
  },

  updateReviewTestStatus: async (testId: string, req: UpdateReviewTestStatusRequest): Promise<ReviewTest | null> => {
    const existing = await getReviewTestRow(testId);
    if (!existing) return null;

    const result = await dbHelper.update({
      TableName: TABLE_REVIEW_TESTS,
      Key: { testId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': req.status },
      ReturnValues: 'ALL_NEW',
    });

    return result.Attributes ? toApiReviewTest(result.Attributes as ReviewTestTable) : null;
  },

  deleteReviewTest: async (testId: string): Promise<boolean> => {
    const existing = await getReviewTestRow(testId);
    if (!existing) return false;

    const items = await listReviewTestItemRows(testId);
    await Promise.all(items.map((i) => releaseLock(i.targetType, i.targetId)));

    // アイテム行が欠損している等のケースでもロックが残らないように、testId で紐づくロックを念のため解放する
    const lockScan = await dbHelper.scan<ReviewLockTable>({
      TableName: TABLE_REVIEW_LOCKS,
      FilterExpression: '#testId = :testId',
      ExpressionAttributeNames: { '#testId': 'testId' },
      ExpressionAttributeValues: { ':testId': testId },
    });
    const locks = lockScan.Items ?? [];
    await Promise.all(
      locks.map((l) => dbHelper.delete({ TableName: TABLE_REVIEW_LOCKS, Key: { targetKey: l.targetKey } }))
    );

    for (const i of items) {
      await dbHelper.delete({ TableName: TABLE_REVIEW_TEST_ITEMS, Key: { testId, itemKey: i.itemKey } });
    }

    await dbHelper.delete({ TableName: TABLE_REVIEW_TESTS, Key: { testId } });

    return true;
  },

  submitReviewTestResults: async (testId: string, req: SubmitReviewTestResultsRequest): Promise<boolean> => {
    const test = await getReviewTestRow(testId);
    if (!test) return false;

    const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();
    const attemptedAt = toIsoAtStartOfDay(dateYmd);

    const itemRows = await listReviewTestItemRows(testId);
    const itemByTargetId = new Map(itemRows.map((r) => [r.targetId, r] as const));

    for (const r of req.results) {
      const item = itemByTargetId.get(r.targetId);
      if (!item) continue;

      const attemptRow: ReviewAttemptTable = {
        targetKey: item.targetKey,
        attemptedAt,
        targetType: item.targetType,
        targetId: item.targetId,
        subject: test.subject,
        state: r.isCorrect ? 'CORRECT' : 'INCORRECT',
        reviewTestId: testId,
      };

      await dbHelper.put({ TableName: TABLE_REVIEW_ATTEMPTS, Item: attemptRow });
      await updateReviewItemGrading({ testId, itemKey: item.itemKey, isCorrect: r.isCorrect });

      // 要件 8.5: 採点登録時点でロック解除
      await releaseLock(item.targetType, item.targetId);
    }

    return true;
  },
};
