/**
 * API path parameters
 *
 * Express の `req.params` 用の型を api-types 側で集中管理する。
 */

/** `GET /materials/:materialId` */
export type GetMaterialSetParams = {
  materialId: string;
};

/** `PATCH /questions/:questionId` */
export type UpdateQuestionParams = {
  questionId: string;
};

/** `POST /tests/:testId/attempts` */
export type CreateAttemptParams = {
  testId: string;
};

/** `PATCH /attempts/:attemptId/submit` */
export type SubmitAttemptParams = {
  attemptId: string;
};

/** `GET /tests/:testId/attempts/latest` */
export type GetLatestAttemptParams = {
  testId: string;
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
