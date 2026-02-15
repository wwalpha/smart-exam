import type { SubjectId } from './subject';

export const EXAM_MODE = {
  QUESTION: 'QUESTION',
  KANJI: 'KANJI',
} as const;

export type ReviewMode = (typeof EXAM_MODE)[keyof typeof EXAM_MODE];

export type ReviewTargetType = ReviewMode;

/** `GET /api/exam/:examId` */
export type GetExamParams = {
  examId: string;
};

/** `PATCH /api/exam/:examId` */
export type UpdateExamStatusParams = {
  examId: string;
};

/** `DELETE /api/exam/:examId` */
export type DeleteExamParams = {
  examId: string;
};

/** `POST /api/exam/:examId/results` */
export type SubmitExamResultsParams = {
  examId: string;
};

/** 復習テスト作成リクエスト */
export type CreateExamRequest = {
  /** 科目 */
  subject: SubjectId;
  /** 出題数 */
  count: number;
  /** モード (QUESTION: 問題, KANJI: 漢字) */
  mode: ReviewMode;
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
  subject: 'ALL' | SubjectId;
  mode: ReviewMode;
  status?: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
  limit?: number;
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
  targetType: ReviewTargetType;
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
  /** 漢字問題: 読み（ひらがな、本文中で下線対象） */
  readingHiragana?: string;
  /** 漢字問題: 下線指定（本文内の部分範囲） */
  underlineSpec?: { type: 'promptSpan'; start: number; length: number };
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
  mode: ReviewMode;
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
  results: { id: string; isCorrect: boolean }[];
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
 * 復習履歴 (対象ごと)
 */
export type ReviewAttempt = {
  /** 対象種別 */
  targetType: ReviewTargetType;
  /** 対象ID */
  targetId: string;
  /** 科目 */
  subject: SubjectId;
  /** 実施日 (YYYY-MM-DD) */
  dateYmd: string;
  /** 実施日時 (ISO8601) */
  attemptedAt: string;
  /** 正誤 */
  isCorrect: boolean;
  /** メモ */
  memo?: string;
  /** 復習テストID (由来がある場合) */
  examId?: string;
};

/** `GET /review-attempts?targetType=...&targetId=...` */
export type ListReviewAttemptsResponse = {
  items: ReviewAttempt[];
};

/** `PUT /review-attempts` */
export type UpsertReviewAttemptRequest = {
  targetType: ReviewTargetType;
  targetId: string;
  subject: SubjectId;
  /** 実施日 (YYYY-MM-DD) */
  dateYmd: string;
  isCorrect: boolean;
  memo?: string;
  /** 実施日を変更する場合に指定 (YYYY-MM-DD) */
  previousDateYmd?: string;
};

/** `PUT /review-attempts` */
export type UpsertReviewAttemptResponse = ReviewAttempt;

/** `DELETE /review-attempts?targetType=...&targetId=...&dateYmd=...` */
export type DeleteReviewAttemptRequest = {
  targetType: ReviewTargetType;
  targetId: string;
  /** 実施日 (YYYY-MM-DD) */
  dateYmd: string;
};

export type DeleteReviewAttemptResponse = {
  ok: true;
};

/**
 * 復習テスト対象（指定期間内に出題された対象のユニーク一覧）
 */
export type ExamTarget = {
  /** 対象種別 */
  targetType: ReviewTargetType;
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
  items: ExamTarget[];
};

/**
 * 復習テスト候補（ExamCandidateTable）
 */
export type ExamCandidate = {
  /** 候補ID */
  id: string;
  /** 科目 */
  subject: SubjectId;
  /** 対象ID（QUESTION: questionId / KANJI: wordId） */
  targetId: string;
  /** モード */
  mode: ReviewMode;
  /** 連続正解回数（streak相当） */
  correctCount: number;
  /** 次回日付 (YYYY-MM-DD) */
  nextTime: string;
  /** ロック: 紐付けられた復習テストID */
  examId?: string;
};

/** `GET /review-test-candidates?subject=...&mode=...` */
export type ListExamCandidatesResponse = {
  items: ExamCandidate[];
};
