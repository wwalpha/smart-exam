import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAMS;

export const updateStatus = async (testId: string, status: ExamTable['status']): Promise<ExamTable | null> => {
  const result = await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { testId },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': status },
    ReturnValues: 'ALL_NEW',
  });

  return (result.Attributes as ExamTable) || null;
};
