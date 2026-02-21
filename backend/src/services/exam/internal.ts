// exam サービス内で共有する変換・ソート処理をまとめる。

import type { Exam, ExamTarget, SubjectId } from '@smart-exam/api-types';
import type { ExamTable } from '@/types/db';
import type { ReviewTargetType } from './internal.types';

export type { ReviewCandidate, ReviewTargetType } from './internal.types';

// 種別と ID からユニークな対象キーを作る。
export const targetKeyOf = (targetType: ReviewTargetType, targetId: string): string => `${targetType}#${targetId}`;

// DB 行を API レスポンス形式へ変換する。
export const toApiExam = (row: ExamTable): Exam => ({
  examId: row.examId,
  subject: row.subject,
  mode: row.mode,
  createdDate: row.createdDate,
  status: row.status,
  pdf: {
    url: `/api/exam/${row.examId}/pdf`,
    downloadUrl: `/api/exam/${row.examId}/pdf?download=1`,
  },
  count: row.count,
  submittedDate: row.submittedDate,
  results: row.results ?? [],
});

// 科目込みで復習対象を一意に識別するキー。
export const toReviewTargetKey = (subject: SubjectId, targetId: string): string => `${subject}#${targetId}`;

// 表示時の並びを「直近出題日 -> 科目 -> ラベル -> ID」で安定化する。
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
