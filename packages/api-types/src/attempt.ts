/**
 * `POST /tests/:testId/attempts`
 * テストの解答(Attempt)を新規作成する
 */
export type CreateAttemptParams = {
  /** 対象テストID */
  testId: string;
};

/**
 * `POST /tests/:testId/attempts`
 * リクエストボディ
 */
export type CreateAttemptRequest = {
  /** 科目ID */
  subjectId: string;
};

/**
 * `POST /tests/:testId/attempts`
 * レスポンス
 */
export type CreateAttemptResponse = Attempt;

/**
 * `PATCH /attempts/:attemptId/submit`
 * Attempt を提出して採点結果を保存する
 */
export type SubmitAttemptParams = {
  /** 対象Attempt ID */
  attemptId: string;
};

/**
 * `PATCH /attempts/:attemptId/submit`
 * リクエストボディ
 */
export type SubmitAttemptRequest = {
  /** 解答結果一覧 */
  results: AttemptResult[];
};

/**
 * `PATCH /attempts/:attemptId/submit`
 * レスポンス
 */
export type SubmitAttemptResponse = Attempt;

/**
 * `GET /tests/:testId/attempts/latest`
 * 指定テストの最新Attemptを取得する
 */
export type GetLatestAttemptParams = {
  /** 対象テストID */
  testId: string;
};

/**
 * `GET /tests/:testId/attempts/latest`
 * レスポンス
 */
export type GetLatestAttemptResponse = Attempt;

/** Attempt の解答結果 */
export type AttemptResult = {
  /** 問題ID */
  questionId: string;
  /** 問番号 */
  number: number;
  /** 正誤 */
  isCorrect: boolean;
};

/** テストの解答(Attempt) */
export type Attempt = {
  /** Attempt ID */
  attemptId: string;
  /** テストID */
  testId: string;
  /** 科目ID */
  subjectId: string;
  /** ステータス */
  status: 'IN_PROGRESS' | 'SUBMITTED';
  /** 開始日時(ISO文字列) */
  startedAt: string;
  /** 提出日時(ISO文字列) */
  submittedAt?: string;
  /** 解答結果一覧 */
  results: AttemptResult[];
};
