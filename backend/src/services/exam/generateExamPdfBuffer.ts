import type { ExamsService } from './createExamsService';
import { ExamPdfService } from './examPdfService';

// 内部で利用する補助処理を定義する
const generateExamPdfBufferImpl = async (
  deps: { getExam: ExamsService['getExam'] },
  testId: string,
  options?: { includeGenerated?: boolean },
): ReturnType<ExamsService['generateExamPdfBuffer']> => {
  // 非同期で必要な値を取得する
  const review = await deps.getExam(testId);
  // 条件に応じて処理を分岐する
  if (!review) return null;
  // 処理結果を呼び出し元へ返す
  return ExamPdfService.generatePdfBuffer(review, { includeGenerated: options?.includeGenerated });
};

// 公開するサービス処理を定義する
export const createGenerateExamPdfBuffer = (deps: {
  getExam: ExamsService['getExam'];
}): ExamsService['generateExamPdfBuffer'] => {
  // 処理結果を呼び出し元へ返す
  return generateExamPdfBufferImpl.bind(null, deps);
};
