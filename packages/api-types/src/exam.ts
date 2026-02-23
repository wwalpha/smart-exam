import type { SubjectId } from './subject';

export const EXAM_MODE = {
  /** 教材モード */
  MATERIAL: 'MATERIAL',
  /** 漢字モード */
  KANJI: 'KANJI',
} as const;

export type ExamMode = (typeof EXAM_MODE)[keyof typeof EXAM_MODE];

export type ExamTargetType = ExamMode;

/** `GET /api/exam/:examId` */
export type GetExamParams = {
  /** 復習テストID */
  examId: string;
};

/** `PATCH /api/exam/:examId` */
export type UpdateExamStatusParams = {
  /** 復習テストID */
  examId: string;
};

/** `DELETE /api/exam/:examId` */
export type DeleteExamParams = {
  /** 復習テストID */
  examId: string;
};

/** `POST /api/exam/:examId/results` */
export type SubmitExamResultsParams = {
  /** 復習テストID */
  examId: string;
};

/** 復習テスト作成リクエスト */
export type CreateExamRequest = {
  /** 科目 */
  subject: SubjectId;
  /** 出題数 */
  count: number;
  /** モード (MATERIAL: 問題, KANJI: 漢字) */
  mode: ExamMode;
  /** 出題対象に含める教材ID（指定順） */
  materialIds?: string[];
};

/** 復習テスト作成レスポンス */
export type CreateExamResponse = Exam;

/** 復習テスト取得レスポンス */
export type GetExamResponse = ExamDetail;

/** 復習テスト一覧取得レスポンス */
export type ExamListResponse = {
  /** 復習テストリスト */
  items: Exam[];
  /** 総件数 */
  total: number;
  /** 次ページ用カーソル */
  cursor?: string;
};

/** `POST /exams/search` */
export type SearchExamsRequest = {
  /** 科目条件（ALL指定可） */
  subject: 'ALL' | SubjectId;
  /** モード */
  mode: ExamMode;
  /** ステータス条件 */
  status?: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
  /** 1ページあたりの取得件数 */
  limit?: number;
  /** 次ページ取得用カーソル */
  cursor?: string;
};

/** `POST /exams/search` */
export type SearchExamsResponse = ExamListResponse;

/**
 * 復習テストの出題アイテム
 */
export type ExamItem = {
  /** アイテムID */
  id: string;
  /** 試験ID */
  examId: string;
  /** 対象種別 */
  targetType: ExamTargetType;
  /** 対象ID */
  targetId: string;
  /** 表示ラベル */
  displayLabel?: string;
  /** 識別キー */
  canonicalKey?: string;
  /** 漢字（漢字テストの場合） */
  kanji?: string;
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
  /** 不正解時の正解値（教材問題の場合） */
  correctAnswer?: string;
  /** 漢字問題: 読み（ひらがな、本文中で下線対象） */
  readingHiragana?: string;
  /** 漢字問題: 下線指定（本文内の部分範囲） */
  underlineSpec?: {
    /** 下線種別 */
    type: 'promptSpan';
    /** 開始位置（UTF-16インデックス） */
    start: number;
    /** 下線長（UTF-16文字数） */
    length: number;
  };
  /** 正誤 (採点後) */
  isCorrect?: boolean;
  /** アイテムID (Frontend compatibility) */
  itemId?: string;
};

/** 復習テスト詳細 */
export type ExamDetail = Exam & {
  /** 出題アイテムリスト */
  items: ExamItem[];
};

/** 復習テストステータス更新リクエスト */
export type UpdateExamStatusRequest = {
  /** 変更後ステータス */
  status: 'IN_PROGRESS' | 'COMPLETED';
};

/** 復習テストステータス更新レスポンス */
export type UpdateExamStatusResponse = Exam;

/**
 * 復習テスト
 */
export type Exam = {
  /** 試験ID */
  examId: string;
  /** 科目 */
  subject: SubjectId;
  /** モード */
  mode: ExamMode;
  /** 作成日 (YYYY-MM-DD) */
  createdDate: string;
  /** 提出日 (YYYY-MM-DD) */
  submittedDate?: string;
  /** ステータス */
  status: 'IN_PROGRESS' | 'COMPLETED';
  /** PDF情報 */
  pdf: {
    /** PDF表示用URL */
    url: string;
    /** PDFダウンロード用URL */
    downloadUrl: string;
  };
  /** 出題数 */
  count: number;
  /** 採点結果 */
  results: {
    /** 対象ID */
    id: string;
    /** 正誤 */
    isCorrect: boolean;
  }[];
};

/**
 * 復習テスト結果
 */
export type ExamResult = {
  /** 対象ID */
  id: string;
  /** 正誤 */
  isCorrect: boolean;
};

/** 復習テスト結果送信リクエスト */
export type SubmitExamResultsRequest = {
  /** 結果リスト */
  results: ExamResult[];
  /** 実施日 (ISO 8601) */
  date?: string;
};

/**
 * 復習テスト対象（指定期間内に出題された対象のユニーク一覧）
 */
export type ExamTarget = {
  /** 対象種別 */
  targetType: ExamTargetType;
  /** 対象ID */
  targetId: string;
  /** 科目 */
  subject: SubjectId;
  /** 表示ラベル */
  displayLabel?: string;
  /** 識別キー */
  canonicalKey?: string;
  /** 漢字（漢字テストの場合） */
  kanji?: string;
  /** よみ（漢字テストの場合） */
  reading?: string;
  /** 出典教材名 */
  materialName?: string;
  /** 出典教材の教材年月日 (YYYY-MM-DD) */
  materialDate?: string;
  /** 問題文 */
  questionText?: string;
  /** 指定期間内で最後に出題された日 */
  lastTestCreatedDate: string;
  /** 指定期間内で出題された回数 */
  includedCount: number;
};

/** `GET /exams/targets?mode=...&from=YYYY-MM-DD&to=YYYY-MM-DD` */
export type ListExamTargetsResponse = {
  /** 復習対象一覧 */
  items: ExamTarget[];
};
