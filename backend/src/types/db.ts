import type { ReviewMode, ReviewTargetType, SubjectId } from '@smart-exam/api-types';

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
  mode: ReviewMode;
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
  targetType: ReviewTargetType;
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
  /** 出典教材ID */
  materialId?: string;
  /** 出典教材の学年 */
  grade?: string;
  /** 出典教材の提供元 */
  provider?: string;
  /** 出典教材名 */
  materialName?: string;
  /** 出典教材の教材年月日 (YYYY-MM-DD) */
  materialDate?: string;
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
  /** 科目 (PK) */
  subject: SubjectId;
  /** 候補キー (SK): nextTime#candidateId */
  candidateKey: string;
  /** 候補ID */
  id: string;
  /** 対象ID（QUESTION: questionId / KANJI: wordId） */
  questionId: string;
  /** モード */
  mode: ReviewMode;
  /** 状態 */
  status: 'OPEN' | 'CLOSED' | 'EXCLUDED';
  /** 連続正解回数（必須、default 0） */
  correctCount: number;
  /** 次回日付 (YYYY-MM-DD) */
  nextTime: string;
  /** ロック: 紐付けられた復習テストID */
  testId?: string;
  /** 作成日時 */
  createdAt: string;
  /** クローズ日時 */
  closedAt?: string;
}
