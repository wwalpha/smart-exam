import type { SubjectId } from '@smart-exam/api-types';

export type CandidateHistory = { submittedDate: string; isCorrect: boolean };

export type BuildCandidateRowParams = {
  subject: SubjectId;
  questionId: string;
  mode: 'KANJI';
  nextTime: string;
  correctCount: number;
  status: 'OPEN' | 'CLOSED' | 'EXCLUDED';
  createdAtIso?: string;
};

export type BuildCandidatesFromHistoriesParams = {
  subject: SubjectId;
  targetWordId: string;
  histories: CandidateHistory[];
  finalStatus: 'AUTO' | 'EXCLUDED';
};
