import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const incrementQuestionCount = async (materialId: string, delta: number): Promise<void> => {
  if (!Number.isFinite(delta) || delta === 0) return;

  await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { materialId },
    UpdateExpression: 'SET #questionCount = if_not_exists(#questionCount, :zero) + :delta',
    ExpressionAttributeNames: {
      '#questionCount': 'questionCount',
    },
    ExpressionAttributeValues: {
      ':zero': 0,
      ':delta': delta,
    },
  });
};
