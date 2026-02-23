import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const CANDIDATES_TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;
const MATERIALS_TABLE_NAME = ENV.TABLE_MATERIALS;
const INDEX_GSI_MATERIAL_ID_STATUS = 'gsi_material_id_status';

export const syncMaterialOpenCandidateCount = async (materialId: string): Promise<void> => {
  const normalizedMaterialId = materialId.trim();
  if (!normalizedMaterialId) return;

  const result = await dbHelper.query({
    TableName: CANDIDATES_TABLE_NAME,
    IndexName: INDEX_GSI_MATERIAL_ID_STATUS,
    KeyConditionExpression: '#materialId = :materialId AND #status = :status',
    ExpressionAttributeNames: {
      '#materialId': 'materialId',
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':materialId': normalizedMaterialId,
      ':status': 'OPEN',
    },
    Select: 'COUNT',
  });

  // 候補更新と件数更新がずれても、再集計値で最終状態を一致させる。
  const openCount = result.Count ?? 0;
  await dbHelper.update({
    TableName: MATERIALS_TABLE_NAME,
    Key: { materialId: normalizedMaterialId },
    UpdateExpression: 'SET #openCandidateCount = :openCandidateCount',
    ExpressionAttributeNames: {
      '#openCandidateCount': 'openCandidateCount',
    },
    ExpressionAttributeValues: {
      ':openCandidateCount': openCount,
    },
  });
};
