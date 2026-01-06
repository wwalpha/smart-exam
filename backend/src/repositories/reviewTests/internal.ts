import { dbHelper } from '@/lib/aws';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import type {
  CreateReviewTestRequest,
  ReviewTest,
  ReviewTestItem,
  ReviewTestTarget,
  SubjectId,
} from '@smart-exam/api-types';
import type { ReviewTestItemEmbedded, ReviewTestTable } from '@/types/db';

export const TABLE_REVIEW_TESTS = ENV.TABLE_REVIEW_TESTS;
export const TABLE_REVIEW_TEST_CANDIDATES = ENV.TABLE_REVIEW_TEST_CANDIDATES;
export const INDEX_GSI_SUBJECT_NEXT_TIME = 'gsi_subject_next_time';

export type ReviewTargetType = 'QUESTION' | 'KANJI';

export type ReviewCandidate = {
  targetType: ReviewTargetType;
  targetId: string;
  subject: string;
  registeredDate: string;
  dueDate: string | null;
  lastAttemptDate: string;
};

export const targetKeyOf = (targetType: ReviewTargetType, targetId: string): string => `${targetType}#${targetId}`;

export const toIsoAtStartOfDay = (ymd: string): string => {
  return DateUtils.format(`${ymd}T00:00:00`);
};

export const parseFilterRange = (req: CreateReviewTestRequest): { fromYmd?: string; toYmd?: string } => {
  if (typeof req.days === 'number' && req.days > 0) {
    const today = DateUtils.todayYmd();
    const from = DateUtils.addDaysYmd(today, -1 * (req.days - 1));
    return { fromYmd: from, toYmd: today };
  }

  const fromYmd = req.rangeFrom ? DateUtils.toYmd(req.rangeFrom) : undefined;
  const toYmd = req.rangeTo ? DateUtils.toYmd(req.rangeTo) : undefined;
  return { fromYmd, toYmd };
};

export const isWithinRange = (ymd: string, range: { fromYmd?: string; toYmd?: string }): boolean => {
  if (range.fromYmd && ymd < range.fromYmd) return false;
  if (range.toYmd && ymd > range.toYmd) return false;
  return true;
};

export const computeDueDate = (params: {
  targetType: ReviewTargetType;
  registeredDate: string;
}): { dueDate: string | null; lastAttemptDate: string } => {
  // ReviewLockTable / ReviewAttemptTable を廃止するため、履歴に依存したスケジューリングは行わない。
  // 初回相当のデフォルトのみ適用する。
  if (params.targetType === 'KANJI') {
    return {
      dueDate: DateUtils.addDaysYmd(params.registeredDate, 7),
      lastAttemptDate: params.registeredDate,
    };
  }

  return { dueDate: params.registeredDate, lastAttemptDate: params.registeredDate };
};

export const getReviewTestRow = async (testId: string): Promise<ReviewTestTable | null> => {
  const result = await dbHelper.get<ReviewTestTable>({ TableName: TABLE_REVIEW_TESTS, Key: { testId } });
  return result?.Item ?? null;
};

export const toApiReviewTest = (row: ReviewTestTable): ReviewTest => ({
  id: row.testId,
  testId: row.testId,
  subject: row.subject,
  mode: row.mode,
  createdDate: row.createdDate,
  status: row.status,
  pdf: {
    url: `/api/review-tests/${row.testId}/pdf`,
    downloadUrl: `/api/review-tests/${row.testId}/pdf?download=1`,
  },
  count: row.count,
  questions: row.questions,
  submittedDate: row.submittedDate,
  results: row.results ?? [],
});

export const toApiReviewTestItem = (testId: string, row: ReviewTestItemEmbedded): ReviewTestItem => ({
  id: row.itemKey,
  itemId: row.targetId,
  testId,
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

export const toReviewTargetKey = (subject: SubjectId, targetId: string): string => `${subject}#${targetId}`;

export const sortTargets = (items: ReviewTestTarget[]): ReviewTestTarget[] => {
  const next = [...items];
  next.sort((a, b) => {
    if (a.lastTestCreatedDate !== b.lastTestCreatedDate) {
      return a.lastTestCreatedDate < b.lastTestCreatedDate ? 1 : -1;
    }
    if (a.subject !== b.subject) return String(a.subject) < String(b.subject) ? -1 : 1;

    const aKey = a.canonicalKey ?? a.kanji ?? a.targetId;
    const bKey = b.canonicalKey ?? b.kanji ?? b.targetId;
    if (aKey !== bKey) return aKey < bKey ? -1 : 1;
    return a.targetId < b.targetId ? -1 : a.targetId > b.targetId ? 1 : 0;
  });
  return next;
};
