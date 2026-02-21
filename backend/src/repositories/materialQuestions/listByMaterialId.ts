import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialQuestionsTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;
const INDEX_GSI_MATERIAL_ID_NUMBER = 'gsi_material_id_number';

export const listByMaterialId = async (materialId: string): Promise<MaterialQuestionsTable[]> => {
  const result = await dbHelper.query<MaterialQuestionsTable>({
    TableName: TABLE_NAME,
    IndexName: INDEX_GSI_MATERIAL_ID_NUMBER,
    KeyConditionExpression: '#materialId = :materialId',
    ExpressionAttributeNames: {
      '#materialId': 'materialId',
    },
    ExpressionAttributeValues: {
      ':materialId': materialId,
    },
    ScanIndexForward: true,
  });

  return result.Items ?? [];
};
