/** `GET /material-sets/:materialSetId` */
export type GetMaterialSetParams = {
  materialSetId: string;
};

/** `GET /material-sets/:materialSetId/questions` */
export type ListQuestionsParams = {
  materialSetId: string;
};

/** `POST /material-sets/:materialSetId/questions` */
export type CreateQuestionParams = {
  materialSetId: string;
};

/** `PATCH /questions/:questionId` */
export type UpdateQuestionParams = {
  questionId: string;
};

/** 教材セット作成リクエスト */
export type CreateMaterialSetRequest = {
  name: string;
  subject: string;
  /** 教材年月 (YYYY-MM) */
  yearMonth: string;
  grade?: string;
  provider?: string;
  testType?: string;
  unit?: string;
  course?: string;
  description?: string;
  keywords?: string[];
};

/** 教材セット作成レスポンス */
export type CreateMaterialSetResponse = MaterialSet;

/** 教材セット更新リクエスト */
export type UpdateMaterialSetRequest = Partial<CreateMaterialSetRequest>;

/** 教材セット取得レスポンス */
export type GetMaterialSetResponse = MaterialSet;

/** 教材セット一覧取得レスポンス */
export type MaterialSetListResponse = {
  /** 教材セットリスト */
  items: MaterialSet[];
  /** 総件数 */
  total: number;
  /** 次ページ用カーソル */
  cursor?: string;
};

/**
 * 教材に関連するファイル
 */
export type MaterialFile = {
  /** ID */
  id: string;
  /** 教材セットID */
  materialSetId: string;
  /** ファイル名 */
  filename: string;
  /** S3キー */
  s3Key: string;
  /** Content-Type */
  contentType: string;
  /** ファイル種別 (QUESTION: 問題, ANSWER: 解答, GRADED_ANSWER: 答案) */
  fileType: 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER';
  /** 作成日時 (ISO 8601) */
  createdAt: string;
};

/**
 * 問題定義
 */
export type Question = {
  /** ID */
  id: string;
  /** 教材セットID */
  materialSetId: string;
  /** 識別キー（正規化されたキー） */
  canonicalKey: string;
  /** 表示ラベル（問題番号など） */
  displayLabel: string;
  /** 科目 */
  subject: string;
  /** カテゴリ/分野 */
  category?: string;
  /** タグ */
  tags?: string[];
  /** 作成日時 (ISO 8601) */
  createdAt: string;
  /** 更新日時 (ISO 8601) */
  updatedAt: string;
};

/** 問題作成リクエスト */
export type CreateQuestionRequest = {
  canonicalKey: string;
  displayLabel: string;
  subject: string;
  category?: string;
  tags?: string[];
};

/** 問題作成レスポンス */
export type CreateQuestionResponse = Question;

/** 問題更新リクエスト */
export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;

/** 問題更新レスポンス */
export type UpdateQuestionResponse = Question;

/**
 * 教材セット（テスト一回分など）
 */
export type MaterialSet = {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** 科目 */
  subject: string;
  /** 学年 */
  grade?: string;
  /** 提供元（SAPIX, YOTSUYA, etc.） */
  provider?: string;
  /** テスト種別（回・テスト名） */
  testType?: string;
  /** 単元 */
  unit?: string;
  /** コース/クラス */
  course?: string;
  /** 説明/メモ */
  description?: string;
  /** キーワードタグ */
  keywords?: string[];
  /** 教材年月 (YYYY-MM) */
  yearMonth: string;
  /** 実施日 (YYYY-MM-DD) - 旧データ互換用 */
  date?: string;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
  /** 更新日時 (ISO 8601) */
  updatedAt: string;
};
