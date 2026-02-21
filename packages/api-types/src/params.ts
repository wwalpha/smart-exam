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
  /** 教材ID */
  materialId: string;
  /** 問題ID */
  questionId: string;
};

/** `DELETE /materials/:materialId/questions/:questionId` */
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
