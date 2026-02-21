// Module: db responsibilities.

import type { ExamMode, SubjectId } from '@smart-exam/api-types';

/**
 * 教材テーブル
 */
export interface MaterialTable {
  /** 教材ID (PK) */
  materialId: string;
  /** 科目ID (GSI1 PK) */
  subjectId: SubjectId;
  /** タイトル */
  title: string;
  /** 問題数 */
  questionCount: number;
  /** 学年 */
  grade: string;
  /** 提供元 */
  provider: string;
  /** 解答用紙S3パス */
  answerSheetPath?: string;
  /** 教材年月日 (YYYY-MM-DD) */
  materialDate: string;
  /** 初回実施日 (YYYY-MM-DD) */
  registeredDate?: string;
  /** 問題PDFパス（試験用紙の場合のみ） */
  questionPdfPath?: string;
  /** 解答PDFパス（試験用紙の場合のみ） */
  answerPdfPath?: string;
  /** 教材セット完了フラグ */
  isCompleted: boolean;
}

/**
 * 教材明細テーブル
 */
export interface MaterialQuestionsTable {
  /** 問題ID (PK) */
  questionId: string;
  /** 教材ID (GSI1 PK) */
  materialId: string;
  /** 科目ID */
  subjectId: SubjectId;
  /** 問題番号 (GSI1 SK) */
  number: number;
  /** 識別キー */
  canonicalKey: string;
  /** 正誤選択（未選択の場合はundefined） */
  choice?: 'CORRECT' | 'INCORRECT';
}

/**
 * 単語テーブル
 */
export interface KanjiTable {
  /** 単語ID (PK) */
  wordId: string;
  /** 問題文（漢字問題の場合は本文） */
  question: string;
  /** 解答（漢字問題の場合は記入すべき漢字） */
  answer: string;
  /** 科目 */
  subject: SubjectId;
  /** 読み（ひらがな、本文中で下線対象） */
  readingHiragana: string;
  /** 下線指定（本文内の部分範囲） */
  underlineSpec: {
    type: 'promptSpan';
    start: number;
    length: number;
  };
}

/**
 * テストテーブル
 */
export interface ExamTable {
  /** 試験ID (PK) */
  examId: string;
  /** 科目 */
  subject: SubjectId;
  /** モード */
  mode: ExamMode;
  /** ステータス */
  status: 'IN_PROGRESS' | 'COMPLETED';
  /** 出題数 */
  count: number;
  /** 作成日 (YYYY-MM-DD) */
  createdDate: string;
  /** 提出日 (YYYY-MM-DD) */
  submittedDate?: string;
  /** PDF S3キー */
  pdfS3Key?: string;
  /** 採点結果 */
  results?: { id: string; isCorrect: boolean }[];
}

/**
 * 復習テスト詳細テーブル
 */
export interface ExamDetailTable {
  /** 試験ID (PK) */
  examId: string;
  /** 明細順序 (SK) */
  seq: number;
  /** 対象種別 */
  targetType: ExamMode;
  /** 対象ID */
  targetId: string;
  /** 正誤（採点後） */
  isCorrect?: boolean;
}

/**
 * 復習テスト候補テーブル
 */
export interface ExamCandidateTable {
  /** 科目 (PK) */
  subject: SubjectId;
  /** 候補キー (SK): nextTime#candidateId */
  candidateKey: string;
  /** 候補ID */
  id: string;
  /** 対象ID（QUESTION: questionId / KANJI: wordId） */
  questionId: string;
  /** モード */
  mode: ExamMode;
  /** 状態 */
  status: 'OPEN' | 'CLOSED' | 'EXCLUDED' | 'LOCKED';
  /** 連続正解回数（必須、default 0） */
  correctCount: number;
  /** 次回日付 (YYYY-MM-DD) */
  nextTime: string;
  /** ロック: 紐付けられた試験ID */
  examId?: string;
  /** 作成日時 */
  createdAt: string;
  /** クローズ日時 */
  closedAt?: string;
}

/**
 * 復習テスト履歴テーブル
 */
export interface ExamHistoryTable {
  /** 履歴ID (PK) */
  id: string;
  /** 科目 */
  subject: SubjectId;
  /** 対象ID（QUESTION: questionId / KANJI: wordId） */
  questionId: string;
  /** モード */
  mode: ExamMode;
  /** 状態 */
  status: 'CLOSED' | 'EXCLUDED';
  /** 連続正解回数 */
  correctCount: number;
  /** 次回日付 (YYYY-MM-DD) */
  nextTime: string;
  /** クローズ日時 */
  closedAt: string;
}
