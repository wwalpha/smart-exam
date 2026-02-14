// Module: internal responsibilities.

import { DateUtils } from '@/lib/dateUtils';
import type { CreateExamRequest, Exam, ExamTarget, SubjectId } from '@smart-exam/api-types';
import type { ExamTable } from '@/types/db';

/** Type definition for ReviewTargetType. */
export type ReviewTargetType = 'QUESTION' | 'KANJI';

/** Type definition for ReviewCandidate. */
export type ReviewCandidate =
  | {
      targetType: 'QUESTION';
      targetId: string;
      subject: SubjectId;
      registeredDate: string;
      dueDate: string | null;
      lastAttemptDate: string;
      candidateKey: string;
    }
  | {
      targetType: 'KANJI';
      targetId: string;
      subject: SubjectId;
      registeredDate: string;
      dueDate: string | null;
      lastAttemptDate: string;
      // ロック判定用
      candidateKey: string;
    };

/** targetKeyOf. */
export const targetKeyOf = (targetType: ReviewTargetType, targetId: string): string => `${targetType}#${targetId}`;

/** Converts data with to iso at start of day. */
export const toIsoAtStartOfDay = (ymd: string): string => {
  return DateUtils.format(`${ymd}T00:00:00`);
};

/** parseFilterRange. */
export const parseFilterRange = (req: CreateExamRequest): { fromYmd?: string; toYmd?: string } => {
  if (typeof req.days === 'number' && req.days > 0) {
    const today = DateUtils.todayYmd();
    const from = DateUtils.addDaysYmd(today, -1 * (req.days - 1));
    return { fromYmd: from, toYmd: today };
  }

  const fromYmd = req.rangeFrom ? DateUtils.toYmd(req.rangeFrom) : undefined;
  const toYmd = req.rangeTo ? DateUtils.toYmd(req.rangeTo) : undefined;
  return { fromYmd, toYmd };
};

/** isWithinRange. */
export const isWithinRange = (ymd: string, range: { fromYmd?: string; toYmd?: string }): boolean => {
  if (range.fromYmd && ymd < range.fromYmd) return false;
  if (range.toYmd && ymd > range.toYmd) return false;
  return true;
};

/** computeDueDate. */
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

/** Converts data with to api review test. */
export const toApiExam = (row: ExamTable): Exam => ({
  id: row.testId,
  testId: row.testId,
  subject: row.subject,
  mode: row.mode,
  createdDate: row.createdDate,
  status: row.status,
  pdf: {
    url: `/api/exam/${row.mode === 'KANJI' ? 'kanji' : 'question'}/${row.testId}/pdf`,
    downloadUrl: `/api/exam/${row.mode === 'KANJI' ? 'kanji' : 'question'}/${row.testId}/pdf?download=1`,
  },
  count: row.count,
  questions: row.questions,
  submittedDate: row.submittedDate,
  results: row.results ?? [],
});

/** Converts data with to review target key. */
export const toReviewTargetKey = (subject: SubjectId, targetId: string): string => `${subject}#${targetId}`;

/** sortTargets. */
export const sortTargets = (items: ExamTarget[]): ExamTarget[] => {
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
