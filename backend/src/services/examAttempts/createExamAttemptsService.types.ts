import type { ExamAttempt, ExamTargetType, SubjectId } from '@smart-exam/api-types';

export type ExamAttemptsService = {
  listExamAttempts: (params: {
    targetType: ExamTargetType;
    targetId: string;
    subject?: SubjectId;
  }) => Promise<ExamAttempt[]>;
};
