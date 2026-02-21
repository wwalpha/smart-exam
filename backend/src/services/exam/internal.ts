// Module: internal responsibilities.

import type { Exam, ExamTarget, SubjectId } from '@smart-exam/api-types';
import type { ExamTable } from '@/types/db';
import type { ReviewTargetType } from './internal.types';

export type { ReviewCandidate, ReviewTargetType } from './internal.types';

/** targetKeyOf. */
export const targetKeyOf = (targetType: ReviewTargetType, targetId: string): string => `${targetType}#${targetId}`;

/** Converts data with to api review test. */
export const toApiExam = (row: ExamTable): Exam => ({
  examId: row.examId,
  subject: row.subject,
  mode: row.mode,
  createdDate: row.createdDate,
  status: row.status,
  pdf: {
    url: `/api/exam/${row.mode === 'KANJI' ? 'kanji' : 'material'}/${row.examId}/pdf`,
    downloadUrl: `/api/exam/${row.mode === 'KANJI' ? 'kanji' : 'material'}/${row.examId}/pdf?download=1`,
  },
  count: row.count,
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
