import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamDetailTable } from '@/types/db';

import { listByExamId } from './listByExamId';

const TABLE_NAME = ENV.TABLE_EXAM_DETAILS;

export const updateResults = async (
  examId: string,
  results: Array<{ id: string; isCorrect: boolean }>,
): Promise<ExamDetailTable[]> => {
  const rows = await listByExamId(examId);
  if (rows.length === 0) return [];

  const resultByTargetId = new Map(results.map((result) => [result.id, result.isCorrect] as const));

  const nextRows = rows.map((row) => {
    const isCorrect = resultByTargetId.get(row.targetId);
    if (typeof isCorrect !== 'boolean') {
      return row;
    }

    return {
      ...row,
      isCorrect,
    };
  });

  await dbHelper.bulk(TABLE_NAME, nextRows as unknown as Record<string, unknown>[]);
  return nextRows;
};
