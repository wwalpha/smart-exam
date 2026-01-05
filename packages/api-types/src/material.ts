import type { SubjectId } from './subject';

/** `GET /material-sets/:materialSetId` */
export type GetMaterialSetParams = {
  materialSetId: string;
};

/** `DELETE /material-sets/:materialSetId` */
export type DeleteMaterialSetParams = {
  materialSetId: string;
};

/** `GET /material-sets/:materialSetId/questions` */
export type ListQuestionsParams = {
  materialSetId: string;
};

/** `GET /material-sets/:materialSetId/files` */
export type ListMaterialFilesParams = {
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

/** `DELETE /questions/:questionId` */
export type DeleteQuestionParams = {
  questionId: string;
};

/** 教材セット作成リクエスト */
export type CreateMaterialSetRequest = {
  name: string;
  subject: SubjectId;
  /** 教材年月 (YYYY-MM) */
  yearMonth: string;
  grade?: string;
  provider?: string;
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

/** `DELETE /material-sets/:materialSetId` */
export type DeleteMaterialSetResponse = Record<string, never>;

/** 教材セット一覧取得レスポンス */
export type MaterialSetListResponse = {
  /** 教材セットリスト */
  items: MaterialSet[];
  /** 総件数 */
  total: number;
  /** 次ページ用カーソル */
  cursor?: string;
};

/** `POST /material-sets/search` */
export type SearchMaterialSetsRequest = {
  subject?: SubjectId;
  grade?: string;
  provider?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

/** `POST /material-sets/search` */
export type SearchMaterialSetsResponse = MaterialSetListResponse;

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

/** `GET /material-sets/:materialSetId/files` */
export type ListMaterialFilesResponse = {
  datas: MaterialFile[];
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
  /** 科目 */
  subject: SubjectId;
  /** タグ */
  tags?: string[];
};

/** 問題作成リクエスト */
export type CreateQuestionRequest = {
  canonicalKey: string;
  subject: SubjectId;
  tags?: string[];
};

/** 問題作成レスポンス */
export type CreateQuestionResponse = Question;

/** 問題更新リクエスト */
export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;

/** 問題更新レスポンス */
export type UpdateQuestionResponse = Question;

/** `DELETE /questions/:questionId` */
export type DeleteQuestionResponse = Record<string, never>;

/**
 * 教材セット（テスト一回分など）
 */
export type MaterialSet = {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** 科目 */
  subject: SubjectId;
  /** 学年 */
  grade?: string;
  /** 提供元（SAPIX, YOTSUYA, etc.） */
  provider?: string;
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
};
