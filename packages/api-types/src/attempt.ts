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

export type CreateAttemptRequest = {
  subjectId: string;
};

export type CreateAttemptResponse = Attempt;

export type SubmitAttemptRequest = {
  results: AttemptResult[];
};

export type SubmitAttemptResponse = Attempt;

export type GetLatestAttemptResponse = Attempt;

export type AttemptResult = {
  questionId: string;
  number: number;
  isCorrect: boolean;
};

export type Attempt = {
  attemptId: string;
  testId: string;
  subjectId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  startedAt: string;
  submittedAt?: string;
  results: AttemptResult[];
};
