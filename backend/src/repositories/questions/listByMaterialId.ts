import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const listByMaterialId = async (materialId: string): Promise<MaterialQuestionTable[]> => {
  const result = await dbHelper.query<MaterialQuestionTable>({
    TableName: TABLE_NAME,
    IndexName: 'gsi_material_id_number',
    KeyConditionExpression: '#materialId = :materialId',
    ExpressionAttributeNames: { '#materialId': 'materialId' },
    ExpressionAttributeValues: { ':materialId': materialId },
  });
  return result.Items || [];
};
