import { ApiError } from '@/lib/apiError';
import type { MaterialQuestionsTable } from '@/types/db';

export const requireMaterialReviewCount = (question: MaterialQuestionsTable): number => {
  const count = question.reviewCount;
  const ids = question.countedExamIds;
  if (question.reviewPolicyVersion !== 2 || !Number.isInteger(count) || count! < 0 || count! > 5 ||
      (ids !== undefined && (!(ids instanceof Set) || ids.size === 0 || [...ids].some((id) => typeof id !== 'string' || !id))) || (ids?.size ?? 0) !== count) {
    throw new ApiError('MATERIAL review migration required or invalid counter', 409, ['material_review_migration_required']);
  }
  return count!;
};
