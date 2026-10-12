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

  for (const row of nextRows) {
    if (typeof row.isCorrect !== 'boolean') continue;
    await dbHelper.update({
      TableName: TABLE_NAME, Key: { examId, seq: row.seq },
      UpdateExpression: 'SET isCorrect = :correct',
      ConditionExpression: 'attribute_exists(targetId) AND attribute_not_exists(reviewProcessed)',
      ExpressionAttributeValues: { ':correct': row.isCorrect },
    });
  }
  return nextRows;
};
