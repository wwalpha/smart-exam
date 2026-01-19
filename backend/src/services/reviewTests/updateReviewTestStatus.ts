import type { ReviewTest } from '@smart-exam/api-types';
import type { UpdateReviewTestStatusRequest } from '@smart-exam/api-types';
import type { ReviewTestTable } from '@/types/db';
import { toApiReviewTest } from './internal';
import { ReviewTestsService } from '@/services';

export const updateReviewTestStatus = async (testId: string, req: UpdateReviewTestStatusRequest): Promise<ReviewTest | null> => {
  const existing = await ReviewTestsService.get(testId);
  if (!existing) return null;

  const updated: ReviewTestTable | null = await ReviewTestsService.updateStatus(testId, req.status);
  return updated ? toApiReviewTest(updated) : null;
};
