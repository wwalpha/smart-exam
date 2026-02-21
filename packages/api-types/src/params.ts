/**
 * API path parameters
 *
 * Express の `req.params` 用の型を api-types 側で集中管理する。
 */

/** `GET /materials/:materialId` */
export type GetMaterialParams = {
  /** 教材ID */
  materialId: string;
};

/** `PATCH /questions/:questionId` */
export type UpdateQuestionParams = {
  /** 問題ID */
  questionId: string;
};

/** `PUT /questions/:questionId/review-candidate` */
export type UpsertQuestionReviewCandidateParams = {
  /** 問題ID */
  questionId: string;
};

/** `DELETE /questions/:questionId/review-candidate` */
export type DeleteQuestionReviewCandidateParams = {
  /** 問題ID */
  questionId: string;
};

/** `GET /materials/:materialId/questions` */
export type ListQuestionsParams = {
  /** 教材ID */
  materialId: string;
};

/** `POST /materials/:materialId/questions` */
export type CreateQuestionParams = {
  /** 教材ID */
  materialId: string;
};

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
