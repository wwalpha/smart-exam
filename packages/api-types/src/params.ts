/**
 * API path parameters
 *
 * Express の `req.params` 用の型を api-types 側で集中管理する。
 */

/** `GET /materials/:materialId` */
export type GetMaterialParams = {
  materialId: string;
};

/** `PATCH /questions/:questionId` */
export type UpdateQuestionParams = {
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

/** `GET /materials/:materialId/questions` */
export type ListQuestionsParams = {
  materialId: string;
};

/** `POST /materials/:materialId/questions` */
export type CreateQuestionParams = {
  materialId: string;
};

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
