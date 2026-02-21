import type { ExamsService } from './index';
import { ExamPdfService } from './examPdfService';

// 試験詳細を読み込み、PDF バッファを直接生成して返す。
export const createGenerateExamPdfBuffer = (deps: {
  getExam: ExamsService['getExam'];
}): ExamsService['generateExamPdfBuffer'] => {
  return async (
    examId: string,
    options?: { includeGenerated?: boolean },
  ): ReturnType<ExamsService['generateExamPdfBuffer']> => {
    const review = await deps.getExam(examId);
    if (!review) return null;
    return ExamPdfService.generatePdfBuffer(review, { includeGenerated: options?.includeGenerated });
  };
};
