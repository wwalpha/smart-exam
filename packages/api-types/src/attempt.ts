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

export type CreateAttemptRequest = {
  subjectId: string;
};

export type SubmitAttemptRequest = {
  results: AttemptResult[];
};
