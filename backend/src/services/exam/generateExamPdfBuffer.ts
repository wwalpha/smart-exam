import type { ReviewTestsService } from './createExamsService';
import { ReviewTestPdfService } from './examPdfService';

export const createGenerateReviewTestPdfBuffer = (deps: {
  getExam: ReviewTestsService['getExam'];
}): ReviewTestsService['generateExamPdfBuffer'] => {
  return async (testId, options) => {
    const review = await deps.getExam(testId);
    if (!review) return null;
    return ReviewTestPdfService.generatePdfBuffer(review, { includeGenerated: options?.includeGenerated });
  };
};
