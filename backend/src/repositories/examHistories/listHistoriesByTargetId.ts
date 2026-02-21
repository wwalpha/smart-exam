import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamHistoryTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAM_HISTORIES;
const INDEX_GSI_QUESTION_ID_CLOSED_AT = 'gsi_question_id_closed_at';

export const listHistoriesByTargetId = async (targetId: string): Promise<ExamHistoryTable[]> => {
  const result = await dbHelper.query<ExamHistoryTable>({
    TableName: TABLE_NAME,
    IndexName: INDEX_GSI_QUESTION_ID_CLOSED_AT,
    KeyConditionExpression: '#questionId = :questionId',
    ExpressionAttributeNames: {
      '#questionId': 'questionId',
    },
    ExpressionAttributeValues: {
      ':questionId': targetId,
    },
    ScanIndexForward: false,
  });

  return result.Items ?? [];
};
