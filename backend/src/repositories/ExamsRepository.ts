// Module: ReviewTestsRepository responsibilities.

import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import type { ReviewTestTable } from '../types/db';


const TABLE_NAME = ENV.TABLE_REVIEW_TESTS;

/** ReviewTestsRepository. */
export const ReviewTestsRepository = {
  get: async (testId: string): Promise<ReviewTestTable | null> => {
    const result = await dbHelper.get<ReviewTestTable>({
      TableName: TABLE_NAME,
      Key: { testId },
    });
    return result?.Item ?? null;
  },

  put: async (item: ReviewTestTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  scanAll: async (): Promise<ReviewTestTable[]> => {
    const result = await dbHelper.scan<ReviewTestTable>({
      TableName: TABLE_NAME,
    });
    return result.Items ?? [];
  },

  updateStatus: async (testId: string, status: ReviewTestTable['status']): Promise<ReviewTestTable | null> => {
    const result = await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { testId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      ReturnValues: 'ALL_NEW',
    });

    return (result.Attributes as ReviewTestTable) || null;
  },

  updatePdfS3Key: async (testId: string, pdfS3Key: string): Promise<ReviewTestTable | null> => {
    const result = await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { testId },
      UpdateExpression: 'SET #pdfS3Key = :pdfS3Key',
      ExpressionAttributeNames: { '#pdfS3Key': 'pdfS3Key' },
      ExpressionAttributeValues: { ':pdfS3Key': pdfS3Key },
      ReturnValues: 'ALL_NEW',
    });

    return (result.Attributes as ReviewTestTable) || null;
  },

  delete: async (testId: string): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { testId },
    });
  },
};
