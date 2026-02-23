import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const listWithOpenCandidates = async (): Promise<MaterialTable[]> => {
  const result = await dbHelper.scan<MaterialTable>({
    TableName: TABLE_NAME,
    ExpressionAttributeNames: {
      '#openCandidateCount': 'openCandidateCount',
    },
    ExpressionAttributeValues: {
      ':zero': 0,
    },
    FilterExpression: '#openCandidateCount > :zero',
  });

  return result.Items || [];
};
