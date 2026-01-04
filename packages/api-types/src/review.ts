/**
 * 復習テスト
 */
export type ReviewTest = {
  /** ID */
  id: string;
  /** 表示用ID */
  testId: string;
  /** 科目 */
  subject: string;
  /** ステータス */
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELED';
  /** 出題数 */
  itemCount: number;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
  /** 更新日時 (ISO 8601) */
  updatedAt: string;
  /** 得点 (完了時のみ) */
  score?: number;
};

/** 復習テスト一覧取得レスポンス */
export type ReviewTestListResponse = {
  /** 復習テストリスト */
  items: ReviewTest[];
  /** 総件数 */
  total: number;
  /** 次ページ用カーソル */
  cursor?: string;
};

/** 復習テスト作成リクエスト */
export type CreateReviewTestRequest = {
  /** 科目 */
  subject: string;
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
export type GetReviewTestResponse = ReviewTest;

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
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELED';
};

/** 復習テストステータス更新レスポンス */
export type UpdateReviewTestStatusResponse = ReviewTest;

/**
 * 復習テスト結果
 */
export type ReviewTestResult = {
  /** 対象ID */
  targetId: string;
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
