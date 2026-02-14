// Module: ExamsRepository responsibilities.

import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import type { ExamTable } from '../types/db';


const TABLE_NAME = ENV.TABLE_REVIEW_TESTS;

/** ExamsRepository. */
export const ExamsRepository = {
  get: async (testId: string): Promise<ExamTable | null> => {
    const result = await dbHelper.get<ExamTable>({
      TableName: TABLE_NAME,
      Key: { testId },
    });
    return result?.Item ?? null;
  },

  put: async (item: ExamTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  scanAll: async (): Promise<ExamTable[]> => {
    const result = await dbHelper.scan<ExamTable>({
      TableName: TABLE_NAME,
    });
    return result.Items ?? [];
  },

  updateStatus: async (testId: string, status: ExamTable['status']): Promise<ExamTable | null> => {
    const result = await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { testId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      ReturnValues: 'ALL_NEW',
    });

    return (result.Attributes as ExamTable) || null;
  },

  updatePdfS3Key: async (testId: string, pdfS3Key: string): Promise<ExamTable | null> => {
    const result = await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { testId },
      UpdateExpression: 'SET #pdfS3Key = :pdfS3Key',
      ExpressionAttributeNames: { '#pdfS3Key': 'pdfS3Key' },
      ExpressionAttributeValues: { ':pdfS3Key': pdfS3Key },
      ReturnValues: 'ALL_NEW',
    });

    return (result.Attributes as ExamTable) || null;
  },

  delete: async (testId: string): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { testId },
    });
  },
};
