/**
 * API path parameters
 *
 * Express の `req.params` 用の型を api-types 側で集中管理する。
 */

/** `GET /material-sets/:materialSetId` */
export type GetMaterialSetParams = {
  materialSetId: string;
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

/** `GET /material-sets/:materialSetId/questions` */
export type ListQuestionsParams = {
  materialSetId: string;
};

/** `POST /material-sets/:materialSetId/questions` */
export type CreateQuestionParams = {
  materialSetId: string;
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
