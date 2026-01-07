import type { SubjectId } from './subject';

/** `GET /materials/:materialId` */
export type GetMaterialParams = {
  materialId: string;
};

/** `DELETE /materials/:materialId` */
export type DeleteMaterialParams = {
  materialId: string;
};

/** `GET /materials/:materialId/questions` */
export type ListQuestionsParams = {
  materialId: string;
};

/** `GET /materials/:materialId/files` */
export type ListMaterialFilesParams = {
  materialId: string;
};

/** `GET /materials/:materialId/files/:fileId` */
export type GetMaterialFileParams = {
  materialId: string;
  fileId: string;
};

/** `POST /materials/:materialId/questions` */
export type CreateQuestionParams = {
  materialId: string;
};

/** `PATCH /questions/:questionId` */
export type UpdateQuestionParams = {
  questionId: string;
};

/** `DELETE /questions/:questionId` */
export type DeleteQuestionParams = {
  questionId: string;
};

/** `PUT /questions/:questionId/review-candidate` */
export type UpsertQuestionReviewCandidateParams = {
  questionId: string;
};

/** `DELETE /questions/:questionId/review-candidate` */
export type DeleteQuestionReviewCandidateParams = {
  questionId: string;
};

/** 教材セット作成リクエスト */
export type CreateMaterialRequest = {
  name: string;
  subject: SubjectId;
  /** 教材年月日 (YYYY-MM-DD) */
  materialDate: string;
  /** 初回実施日 (YYYY-MM-DD) */
  registeredDate: string;
  grade: string;
  provider: string;
};

/** 教材セット作成レスポンス */
export type CreateMaterialResponse = Material;

/** 教材セット更新リクエスト */
export type UpdateMaterialRequest = Partial<CreateMaterialRequest> & {
  /** 問題PDFのS3キー */
  questionPdfPath?: string;
  /** 解答PDFのS3キー */
  answerPdfPath?: string;
  /** 採点済み答案PDFのS3キー */
  answerSheetPath?: string;
};

/** `PATCH /materials/:materialId` */
export type UpdateMaterialParams = {
  materialId: string;
};

/** 教材セット更新レスポンス */
export type UpdateMaterialResponse = Material;

/** 教材セット取得レスポンス */
export type GetMaterialResponse = Material;

/** `DELETE /materials/:materialId` */
export type DeleteMaterialResponse = Record<string, never>;

/** 教材セット一覧取得レスポンス */
export type MaterialListResponse = {
  /** 教材セットリスト */
  items: Material[];
  /** 総件数 */
  total: number;
  /** 次ページ用カーソル */
  cursor?: string;
};

/** `POST /materials/search` */
export type SearchMaterialsRequest = {
  subject?: SubjectId;
  grade?: string;
  provider?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

/** `POST /materials/search` */
export type SearchMaterialsResponse = MaterialListResponse;

/**
 * 教材に関連するファイル
 */
export type MaterialFile = {
  /** ID */
  id: string;
  /** 教材ID */
  materialId: string;
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

/** `GET /materials/:materialId/files` */
export type ListMaterialFilesResponse = {
  datas: MaterialFile[];
};

/** 問題の復習候補情報（最新） */
export type QuestionReviewCandidateSummary = {
  /** 状態 */
  status: 'OPEN' | 'CLOSED' | 'EXCLUDED';
  /** 次回日付 (YYYY-MM-DD) */
  nextTime: string;
  /** 連続正解回数 */
  correctCount: number;
};

/**
 * 問題定義
 */
export type Question = {
  /** ID */
  id: string;
  /** 教材ID */
  materialId: string;
  /** 識別キー（正規化されたキー） */
  canonicalKey: string;
  /** 科目 */
  subject: SubjectId;
  /** タグ */
  tags?: string[];
  /** 復習候補（最新） */
  reviewCandidate?: QuestionReviewCandidateSummary;
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
export type Material = {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** 科目 */
  subject: SubjectId;
  /** 学年 */
  grade: string;
  /** 提供元（SAPIX, YOTSUYA, etc.） */
  provider: string;
  /** 教材年月日 (YYYY-MM-DD) */
  materialDate: string;
  /** 初回実施日 (YYYY-MM-DD) */
  registeredDate: string;
};
