import type { ReviewTestsService } from './createReviewTestsService';
import { ReviewTestPdfService } from './reviewTestPdfService';

export const createGenerateReviewTestPdfBuffer = (deps: {
  getReviewTest: ReviewTestsService['getReviewTest'];
}): ReviewTestsService['generateReviewTestPdfBuffer'] => {
  return async (testId, options) => {
    const review = await deps.getReviewTest(testId);
    if (!review) return null;
    return ReviewTestPdfService.generatePdfBuffer(review, { includeGenerated: options?.includeGenerated });
  };
};
