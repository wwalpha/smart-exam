import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamDetailTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAM_DETAILS;

export const listByExamId = async (examId: string): Promise<ExamDetailTable[]> => {
  const result = await dbHelper.query<ExamDetailTable>({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#examId = :examId',
    ExpressionAttributeNames: { '#examId': 'examId' },
    ExpressionAttributeValues: { ':examId': examId },
    ScanIndexForward: true,
    ConsistentRead: true,
  });

  return result.Items ?? [];
};
