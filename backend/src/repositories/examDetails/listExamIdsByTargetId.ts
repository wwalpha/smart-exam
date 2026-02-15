import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamDetailTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAM_DETAILS;
const INDEX_GSI_TARGET_ID_EXAM_ID = 'gsi_target_id_exam_id';

export const listExamIdsByTargetId = async (targetId: string): Promise<string[]> => {
  const result = await dbHelper.query<ExamDetailTable>({
    TableName: TABLE_NAME,
    IndexName: INDEX_GSI_TARGET_ID_EXAM_ID,
    KeyConditionExpression: '#targetId = :targetId',
    ExpressionAttributeNames: { '#targetId': 'targetId' },
    ExpressionAttributeValues: { ':targetId': targetId },
    ScanIndexForward: false,
    Limit: 500,
  });

  return Array.from(new Set((result.Items ?? []).map((row) => row.examId)));
};
