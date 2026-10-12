import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { get } from '@/repositories/materials/get';

const CANDIDATES_TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;
const MATERIALS_TABLE_NAME = ENV.TABLE_MATERIALS;

export const syncMaterialOpenCandidateCount = async (materialId: string): Promise<void> => {
  const normalizedMaterialId = materialId.trim();
  if (!normalizedMaterialId) return;
  const material = await get(normalizedMaterialId);
  if (!material) return;

  const result = await dbHelper.query({
    TableName: CANDIDATES_TABLE_NAME,
    ConsistentRead: true,
    KeyConditionExpression: '#subject = :subject',
    FilterExpression: '#materialId = :materialId AND #status = :status',
    ExpressionAttributeNames: {
      '#subject': 'subject',
      '#materialId': 'materialId',
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':subject': material.subjectId,
      ':materialId': normalizedMaterialId,
      ':status': 'OPEN',
    },
  });

  // 候補更新と件数更新がずれても、再集計値で最終状態を一致させる。
  const openCount = result.Items?.length ?? 0;
  await dbHelper.update({
    TableName: MATERIALS_TABLE_NAME,
    Key: { materialId: normalizedMaterialId },
    ConditionExpression: 'attribute_exists(materialId)',
    UpdateExpression: 'SET #openCandidateCount = :openCandidateCount',
    ExpressionAttributeNames: {
      '#openCandidateCount': 'openCandidateCount',
    },
    ExpressionAttributeValues: {
      ':openCandidateCount': openCount,
    },
  });
};
