import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAMS;

export const updatePdfS3Key = async (testId: string, pdfS3Key: string): Promise<ExamTable | null> => {
  const result = await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { testId },
    UpdateExpression: 'SET #pdfS3Key = :pdfS3Key',
    ExpressionAttributeNames: { '#pdfS3Key': 'pdfS3Key' },
    ExpressionAttributeValues: { ':pdfS3Key': pdfS3Key },
    ReturnValues: 'ALL_NEW',
  });

  return (result.Attributes as ExamTable) || null;
};
