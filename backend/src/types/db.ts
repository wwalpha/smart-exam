import type { SubjectId } from '@smart-exam/api-types';

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
  /** 説明 */
  description?: string;
  /** 問題数 */
  questionCount: number;
  /** 学年 */
  grade?: string;
  /** 提供元 */
  provider?: string;
  /** コース */
  course?: string;
  /** キーワード */
  keywords?: string[];
  /** 解答用紙S3パス */
  answerSheetPath?: string;
  /** 教材年月 (YYYY-MM) */
  yearMonth?: string;
  /** 実施日 - 旧データ互換用 */
  date?: string;

  /** 試験カテゴリ（試験用紙の場合のみ） */
  category?: string;
  /** 問題PDFパス（試験用紙の場合のみ） */
  questionPdfPath?: string;
  /** 解答PDFパス（試験用紙の場合のみ） */
  answerPdfPath?: string;
}

/**
 * 問題テーブル
 */
export interface MaterialQuestionTable {
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
}

/**
 * 実施テーブル
 */
export interface AttemptTable {
  /** 実施ID (PK) */
  attemptId: string;
  /** テストID (GSI1 PK) */
  testId: string;
  /** 科目ID */
  subjectId: SubjectId;
  /** ステータス */
  status: 'IN_PROGRESS' | 'SUBMITTED';
  /** 開始日時 (GSI1 SK) */
  startedAt: string;
  /** 提出日時 */
  submittedAt?: string;
  /** 結果リスト */
  results: { questionId: string; number: number; isCorrect: boolean }[];
}

/**
 * 単語テーブル
 */
export interface WordMasterTable {
  /** 単語ID (PK) */
  wordId: string;
  /** 問題文 */
  question: string;
  /** 解答 */
  answer: string;
  /** 科目 */
  subject: SubjectId;
}

/**
 * 復習テストテーブル
 */
export interface ReviewTestTable {
  /** テストID (PK) */
  testId: string;
  /** 科目 */
  subject: SubjectId;
  /** モード */
  mode: 'QUESTION' | 'KANJI';
  /** ステータス */
  status: 'IN_PROGRESS' | 'COMPLETED';
  /** 出題数 */
  count: number;
  /** 出題IDリスト（mode に応じて questionId / wordId を格納） */
  questions: string[];
  /** 作成日 (YYYY-MM-DD) */
  createdDate: string;
  /** 提出日 (YYYY-MM-DD) */
  submittedDate?: string;
  /** PDF S3キー */
  pdfS3Key: string;
  /** 採点結果 */
  results?: { id: string; isCorrect: boolean }[];
  /** 出題スナップショット（ReviewTestItemTable をマージ） */
  items?: ReviewTestItemEmbedded[];
}

/**
 * 復習テスト項目（ReviewTestTable に埋め込み）
 */
export interface ReviewTestItemEmbedded {
  /** アイテムキー（テスト内で一意） */
  itemKey: string;
  /** 表示順 */
  order: number;
  /** 対象種別 */
  targetType: 'QUESTION' | 'KANJI';
  /** 対象ID */
  targetId: string;
  /** ロックキー */
  targetKey: string;
  /** 表示ラベル */
  displayLabel?: string;
  /** 識別キー */
  canonicalKey?: string;
  /** 漢字 */
  kanji?: string;
  /** よみ */
  reading?: string;
  /** 出典教材名 */
  materialSetName?: string;
  /** 出典教材日付 */
  materialSetDate?: string;
  /** 問題文 */
  questionText?: string;
  /** 解答 */
  answerText?: string;
  /** 正誤 (採点後) */
  isCorrect?: boolean;
}

/**
 * 復習テスト候補テーブル
 */
export interface ReviewTestCandidateTable {
  /** 候補ID */
  id: string;
  /** 科目 (PK) */
  subject: SubjectId;
  /** 問題ID (SK) */
  questionId: string;
  /** モード */
  mode: 'QUESTION' | 'KANJI';
  /** 次回日付 (YYYY-MM-DD) */
  nextTime: string;
  /** ロック: 紐付けられた復習テストID */
  testId?: string;
}
