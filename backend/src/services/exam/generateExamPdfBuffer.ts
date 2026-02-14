import type { ExamsService } from './createExamsService';
import { ExamPdfService } from './examPdfService';

export const createGenerateExamPdfBuffer = (deps: {
  getExam: ExamsService['getExam'];
}): ExamsService['generateExamPdfBuffer'] => {
  return async (testId, options) => {
    const review = await deps.getExam(testId);
    if (!review) return null;
    return ExamPdfService.generatePdfBuffer(review, { includeGenerated: options?.includeGenerated });
  };
};
