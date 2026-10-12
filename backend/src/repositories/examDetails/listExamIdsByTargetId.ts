import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamDetailTable } from '@/types/db';
import { QueryCommand, type QueryCommandInput } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = ENV.TABLE_EXAM_DETAILS;
const INDEX_GSI_TARGET_ID_EXAM_ID = 'gsi_target_id_exam_id';

export async function* iterateExamIdsByTargetId(targetId: string): AsyncGenerator<string> {
  let startKey: QueryCommandInput['ExclusiveStartKey'];
  const seen = new Set<string>();
  do {
    // dbHelper.query の自動ページングを避け、呼び出し側が閾値で停止できるようにする。
    const result = await dbHelper.getDocumentClient().send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_TARGET_ID_EXAM_ID,
      KeyConditionExpression: '#targetId = :targetId',
      ExpressionAttributeNames: { '#targetId': 'targetId', '#examId': 'examId' },
      ExpressionAttributeValues: { ':targetId': targetId },
      ProjectionExpression: '#examId',
      ScanIndexForward: false,
      Limit: 25,
      ExclusiveStartKey: startKey,
    }));
    for (const row of result.Items ?? []) {
      if (seen.has(row.examId)) continue;
      seen.add(row.examId);
      yield row.examId;
    }
    startKey = result.LastEvaluatedKey;
  } while (startKey);
}

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
