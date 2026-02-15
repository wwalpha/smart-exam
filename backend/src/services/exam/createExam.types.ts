import type { ReviewMode, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './createExamsService.types';

export type ReviewCandidate = {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
  subject: SubjectId;
  registeredDate: string;
  dueDate: string | null;
  lastAttemptDate: string;
  candidateKey?: string;
};

export type CreateExamDeps = {
  repositories: Repositories;
  getExam: ExamsService['getExam'];
  deleteExam: ExamsService['deleteExam'];
};

export type CandidateListParams = {
  subject: SubjectId;
  mode?: ReviewMode;
  todayYmd?: string;
};
