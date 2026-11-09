import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { ApiError } from '@/lib/apiError';
import type { ExamDetailTable, ExamTable } from '@/types/db';
import { iterateExamIdsByTargetId } from './listExamIdsByTargetId';
import { listByExamId } from './listByExamId';

export const resolveMaterialReviewResult = (
  exam: ExamTable,
  details: ExamDetailTable[],
  questionId: string,
): boolean | undefined => {
  const results = new Set([
    ...details.filter((detail) => detail.targetId === questionId).map((detail) => detail.isCorrect),
    ...(exam.results ?? []).filter((result) => result.id === questionId).map((result) => result.isCorrect),
  ].filter((result): result is boolean => typeof result === 'boolean'));
  if (results.size > 1) {
    throw new ApiError(`Conflicting review results: ${exam.examId}/${questionId}`, 409, [
      'inconsistent_material_review_results',
    ]);
  }
  return results.values().next().value;
};

export const countCompletedMaterialReviews = async (params: {
  questionId: string;
  excludeExamId?: string;
}): Promise<{ completedCountUpTo3: number; hasAnyCorrect: boolean }> => {
  let completedCountUpTo3 = 0;
  let hasAnyCorrect = false;
  for await (const examId of iterateExamIdsByTargetId(params.questionId)) {
    if (examId === params.excludeExamId) continue;
    const result = await dbHelper.get<ExamTable>({
      TableName: ENV.TABLE_EXAMS,
      Key: { examId },
      ConsistentRead: true,
    });
    const exam = result?.Item;
    if (!exam || exam.mode !== 'MATERIAL' || exam.status !== 'COMPLETED') continue;

    // GSIの採点結果は遅延し得るため、明細本体を強整合で確認する。
    const details = await listByExamId(examId);
    if (!details.some((detail) => detail.targetId === params.questionId)) continue;
    const isCorrect = resolveMaterialReviewResult(exam, details, params.questionId);
    if (typeof isCorrect !== 'boolean') continue;
    completedCountUpTo3 = Math.min(3, completedCountUpTo3 + 1);
    hasAnyCorrect ||= isCorrect;
    if (completedCountUpTo3 >= 3 && hasAnyCorrect) break;
  }
  return { completedCountUpTo3, hasAnyCorrect };
};
