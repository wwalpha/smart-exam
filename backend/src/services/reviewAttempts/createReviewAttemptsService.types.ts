import type { ReviewAttempt, ReviewTargetType, SubjectId } from '@smart-exam/api-types';

export type ReviewAttemptsService = {
  listReviewAttempts: (params: {
    targetType: ReviewTargetType;
    targetId: string;
    subject?: SubjectId;
  }) => Promise<ReviewAttempt[]>;
};
