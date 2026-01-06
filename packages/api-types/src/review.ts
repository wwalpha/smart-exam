import type { SubjectId } from './subject';

/** `GET /review-tests/:testId` */
export type GetReviewTestParams = {
  testId: string;
};

/** `PATCH /review-tests/:testId` */
export type UpdateReviewTestStatusParams = {
  testId: string;
};

/** `DELETE /review-tests/:testId` */
export type DeleteReviewTestParams = {
  testId: string;
};

/** `POST /review-tests/:testId/results` */
export type SubmitReviewTestResultsParams = {
  testId: string;
};

/** 復習テスト作成リクエスト */
export type CreateReviewTestRequest = {
  /** 科目 */
  subject: SubjectId;
  /** 出題数 */
  count: number;
  /** モード (QUESTION: 問題, KANJI: 漢字) */
  mode: 'QUESTION' | 'KANJI';
  /** 対象期間（直近N日） */
  days?: number;
  /** 対象期間 (開始日 ISO) */
  rangeFrom?: string;
  /** 対象期間 (終了日 ISO) */
  rangeTo?: string;
  /** 正解済みの問題を含めるか */
  includeCorrect?: boolean;
};

/** 復習テスト作成レスポンス */
export type CreateReviewTestResponse = ReviewTest;

/** 復習テスト取得レスポンス */
export type GetReviewTestResponse = ReviewTestDetail;

/** 復習テスト一覧取得レスポンス */
export type ReviewTestListResponse = {
  /** 復習テストリスト */
  items: ReviewTest[];
  /** 総件数 */
  total: number;
  /** 次ページ用カーソル */
  cursor?: string;
};

/** `POST /review-tests/search` */
export type SearchReviewTestsRequest = {
  subject: 'ALL' | SubjectId;
  mode: 'QUESTION' | 'KANJI';
  status?: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
  limit?: number;
  cursor?: string;
};

/** `POST /review-tests/search` */
export type SearchReviewTestsResponse = ReviewTestListResponse;

/**
 * 復習テストの出題アイテム
 */
export type ReviewTestItem = {
  /** アイテムID */
  id: string;
  /** テストID */
  testId: string;
  /** 対象種別 */
  targetType: 'QUESTION' | 'KANJI';
  /** 対象ID */
  targetId: string;
  /** 表示ラベル */
  displayLabel?: string;
  /** 識別キー */
  canonicalKey?: string;
  /** 漢字（漢字テストの場合） */
  kanji?: string;
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
  /** アイテムID (Frontend compatibility) */
  itemId?: string;
};

/** 復習テスト詳細 */
export type ReviewTestDetail = ReviewTest & {
  /** 出題アイテムリスト */
  items: ReviewTestItem[];
};

/** 復習テストステータス更新リクエスト */
export type UpdateReviewTestStatusRequest = {
  status: 'IN_PROGRESS' | 'COMPLETED';
};

/** 復習テストステータス更新レスポンス */
export type UpdateReviewTestStatusResponse = ReviewTest;

/**
 * 復習テスト
 */
export type ReviewTest = {
  /** ID */
  id: string;
  /** 表示用ID */
  testId: string;
  /** 科目 */
  subject: SubjectId;
  /** モード */
  mode: 'QUESTION' | 'KANJI';
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
  /** 出題IDリスト（mode に応じて questionId / wordId を格納） */
  questions: string[];
  /** 採点結果 */
  results: { id: string; isCorrect: boolean }[];
};

/**
 * 復習テスト結果
 */
export type ReviewTestResult = {
  /** 対象ID */
  id: string;
  /** 正誤 */
  isCorrect: boolean;
};

/** 復習テスト結果送信リクエスト */
export type SubmitReviewTestResultsRequest = {
  /** 結果リスト */
  results: ReviewTestResult[];
  /** 実施日 (ISO 8601) */
  date?: string;
};

/**
 * 復習履歴 (対象ごと)
 */
export type ReviewAttempt = {
  /** 対象種別 */
  targetType: 'QUESTION' | 'KANJI';
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
  reviewTestId?: string;
};

/** `GET /review-attempts?targetType=...&targetId=...` */
export type ListReviewAttemptsResponse = {
  items: ReviewAttempt[];
};

/** `PUT /review-attempts` */
export type UpsertReviewAttemptRequest = {
  targetType: 'QUESTION' | 'KANJI';
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
  targetType: 'QUESTION' | 'KANJI';
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
export type ReviewTestTarget = {
  /** 対象種別 */
  targetType: 'QUESTION' | 'KANJI';
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
  materialSetName?: string;
  /** 出典教材日付 */
  materialSetDate?: string;
  /** 問題文 */
  questionText?: string;
  /** 指定期間内で最後に出題された日 */
  lastTestCreatedDate: string;
  /** 指定期間内で出題された回数 */
  includedCount: number;
};

/** `GET /review-tests/targets?mode=...&from=YYYY-MM-DD&to=YYYY-MM-DD` */
export type ListReviewTestTargetsResponse = {
  items: ReviewTestTarget[];
};
