import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamHistoryTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAM_HISTORIES;

export const putHistory = async (item: ExamHistoryTable): Promise<void> => {
  try {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(#id)',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
    });
  } catch (error: unknown) {
    const name = (error as { name?: string } | null)?.name;
    if (name === 'ConditionalCheckFailedException') {
      return;
    }
    throw error;
  }
};
