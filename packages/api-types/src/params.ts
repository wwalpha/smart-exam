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
