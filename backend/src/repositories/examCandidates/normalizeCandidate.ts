import type { ExamCandidateTable } from '@/types/db';

export type ExamCandidateTableRaw = Omit<ExamCandidateTable, 'correctCount'> & {
  correctCount?: number;
};

export const normalizeCandidate = (raw: ExamCandidateTableRaw): ExamCandidateTable => {
  return {
    ...raw,
    correctCount: typeof raw.correctCount === 'number' ? raw.correctCount : 0,
  };
};
