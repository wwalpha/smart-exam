import type { SubjectId } from './subject';

/** `GET /materials/:materialId` */
export type GetMaterialParams = {
  /** 教材ID */
  materialId: string;
};

/** `DELETE /materials/:materialId` */
export type DeleteMaterialParams = {
  /** 教材ID */
  materialId: string;
};

/** `POST /materials/:materialId/completion` */
export type CompleteMaterialParams = {
  /** 教材ID */
  materialId: string;
};

/** `GET /materials/:materialId/questions` */
export type ListQuestionsParams = {
  /** 教材ID */
  materialId: string;
};

/** `GET /materials/:materialId/files` */
export type ListMaterialFilesParams = {
  /** 教材ID */
  materialId: string;
};

/** `GET /materials/:materialId/files/:fileId` */
export type GetMaterialFileParams = {
  /** 教材ID */
  materialId: string;
  /** ファイルID */
  fileId: string;
};

/** `POST /materials/:materialId/upload` */
export type UploadMaterialFileParams = {
  /** 教材ID */
  materialId: string;
};

/** 教材PDFのファイル種別 */
export type MaterialUploadFileType = 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER';

/** 教材PDFアップロードURL発行リクエスト */
export type UploadMaterialFileRequest = {
  /** ファイルのContent-Type */
  contentType: string;
  /** 元ファイル名 */
  fileName: string;
  /** ファイル種別 */
  filetype: MaterialUploadFileType;
};

/** 教材PDFアップロードURL発行レスポンス */
export type UploadMaterialFileResponse = {
  /** 署名付きアップロードURL */
  uploadUrl: string;
  /** アップロード先S3キー */
  fileKey: string;
};

/** `POST /materials/:materialId/questions` */
export type CreateQuestionParams = {
  /** 教材ID */
  materialId: string;
};

/** `PATCH /questions/:questionId` */
export type UpdateQuestionParams = {
  /** 教材ID */
  materialId: string;
  /** 問題ID */
  questionId: string;
};

/** `DELETE /questions/:questionId` */
export type DeleteQuestionParams = {
  /** 教材ID */
  materialId: string;
  /** 問題ID */
  questionId: string;
};

/** `PATCH /materials/:materialId/questions/:questionId/choices` */
export type SetQuestionChoiceParams = {
  /** 教材ID */
  materialId: string;
  /** 問題ID */
  questionId: string;
};

/** 教材セット作成リクエスト */
export type CreateMaterialRequest = {
  /** 教材名 */
  name: string;
  /** 科目 */
  subject: SubjectId;
  /** 教材年月日 (YYYY-MM-DD) */
  materialDate: string;
  /** 初回実施日 (YYYY-MM-DD) */
  registeredDate: string;
  /** 学年 */
  grade: string;
  /** 提供元 */
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

/** `POST /materials/:materialId/completion` */
export type CompleteMaterialRequest = Record<string, never>;

/** `POST /materials/:materialId/completion` */
export type CompleteMaterialResponse = Material;

/** `PATCH /materials/:materialId` */
export type UpdateMaterialParams = {
  /** 教材ID */
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
  /** 科目での絞り込み */
  subject?: SubjectId;
  /** 学年での絞り込み */
  grade?: string;
  /** 提供元での絞り込み */
  provider?: string;
  /** 教材年月日の開始日 */
  from?: string;
  /** 教材年月日の終了日 */
  to?: string;
  /** 自由検索キーワード */
  q?: string;
  /** 1ページあたりの取得件数 */
  limit?: number;
  /** 次ページ取得用カーソル */
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
  /** ファイル一覧 */
  datas: MaterialFile[];
};

/** 問題の復習候補情報（最新） */
export type QuestionReviewCandidateSummary = {
  /** 状態 */
  status: 'OPEN' | 'CLOSED' | 'EXCLUDED' | 'LOCKED';
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
  /** 正誤選択（画面入力値） */
  choice?: 'CORRECT' | 'INCORRECT';
};

/** 問題作成リクエスト */
export type CreateQuestionRequest = {
  /** 識別キー（正規化されたキー） */
  canonicalKey: string;
  /** 科目 */
  subject: SubjectId;
  /** タグ */
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
  /** 完了状態 */
  isCompleted: boolean;
};
/** 問題一覧取得レスポンス */
export type QuestionListResponse = {
  /** 問題一覧 */
  datas: Question[];
};

/** 検索結果（問題検索） */
export type QuestionSearchResult = {
  /** 問題ID */
  id: string;
  /** 科目 */
  subject: SubjectId;
  /** 単元 */
  unit?: string;
  /** 問題文 */
  questionText: string;
  /** 出典教材ID */
  sourceMaterialId: string;
  /** 出典教材名 */
  sourceMaterialName: string;
};

/** `POST /questions/search` */
export type SearchQuestionsRequest = {
  /** 検索キーワード */
  keyword?: string;
  /** 科目での絞り込み */
  subject?: SubjectId;
};

/** `POST /questions/search` */
export type SearchQuestionsResponse = {
  /** 問題検索結果一覧 */
  datas: QuestionSearchResult[];
};

/** `PATCH /materials/:materialId/questions/:questionId/choices` */
export type SetQuestionChoiceRequest = {
  /** 正解なら true */
  isCorrect: boolean;
};

/** `PATCH /materials/:materialId/questions/:questionId/choices` */
export type SetQuestionChoiceResponse = {
  /** 成功フラグ */
  ok: true;
};
