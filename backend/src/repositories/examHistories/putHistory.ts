import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamHistoryTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAM_HISTORIES;

export const putHistory = async (item: ExamHistoryTable): Promise<void> => {
  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(#subject) AND attribute_not_exists(#candidateKey)',
    ExpressionAttributeNames: {
      '#subject': 'subject',
      '#candidateKey': 'candidateKey',
    },
  });
};
