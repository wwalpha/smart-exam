// Module: internal responsibilities.

import { DateUtils } from '@/lib/dateUtils';
import type { Exam, ExamTarget, SubjectId } from '@smart-exam/api-types';
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
  // 処理結果を呼び出し元へ返す
  return DateUtils.format(`${ymd}T00:00:00`);
};

/** isWithinRange. */
export const isWithinRange = (ymd: string, range: { fromYmd?: string; toYmd?: string }): boolean => {
  // 条件に応じて処理を分岐する
  if (range.fromYmd && ymd < range.fromYmd) return false;
  // 条件に応じて処理を分岐する
  if (range.toYmd && ymd > range.toYmd) return false;
  // 処理結果を呼び出し元へ返す
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
    // 処理結果を呼び出し元へ返す
    return {
      dueDate: DateUtils.addDaysYmd(params.registeredDate, 7),
      lastAttemptDate: params.registeredDate,
    };
  }

  // 処理結果を呼び出し元へ返す
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
  // 処理で使う値を準備する
  const next = [...items];
  next.sort((a, b) => {
    // 条件に応じて処理を分岐する
    if (a.lastTestCreatedDate !== b.lastTestCreatedDate) {
      // 処理結果を呼び出し元へ返す
      return a.lastTestCreatedDate < b.lastTestCreatedDate ? 1 : -1;
    }
    // 条件に応じて処理を分岐する
    if (a.subject !== b.subject) return String(a.subject) < String(b.subject) ? -1 : 1;

    // 処理で使う値を準備する
    const aKey = a.canonicalKey ?? a.kanji ?? a.targetId;
    // 処理で使う値を準備する
    const bKey = b.canonicalKey ?? b.kanji ?? b.targetId;
    // 条件に応じて処理を分岐する
    if (aKey !== bKey) return aKey < bKey ? -1 : 1;
    // 処理結果を呼び出し元へ返す
    return a.targetId < b.targetId ? -1 : a.targetId > b.targetId ? 1 : 0;
  });
  // 処理結果を呼び出し元へ返す
  return next;
};
