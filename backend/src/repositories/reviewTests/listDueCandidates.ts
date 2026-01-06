import { dbHelper } from '@/lib/aws';
import { DateUtils } from '@/lib/dateUtils';
import { INDEX_GSI_SUBJECT_NEXT_TIME, TABLE_REVIEW_TEST_CANDIDATES } from './internal';
import type { SubjectId } from '@smart-exam/api-types';
import type { ReviewTestCandidateTable } from '@/types/db';

export const listDueCandidates = async (params: {
  subject: SubjectId;
  mode?: 'QUESTION' | 'KANJI';
  todayYmd?: string;
}): Promise<ReviewTestCandidateTable[]> => {
  const today = params.todayYmd ?? DateUtils.todayYmd();

  const result = await dbHelper.query<ReviewTestCandidateTable>({
    TableName: TABLE_REVIEW_TEST_CANDIDATES,
    IndexName: INDEX_GSI_SUBJECT_NEXT_TIME,
    KeyConditionExpression: '#subject = :subject AND #nextTime <= :today',
    ExpressionAttributeNames: {
      '#subject': 'subject',
      '#nextTime': 'nextTime',
      ...(params.mode ? { '#mode': 'mode' } : {}),
    },
    ExpressionAttributeValues: {
      ':subject': params.subject,
      ':today': today,
      ...(params.mode ? { ':mode': params.mode } : {}),
    },
    ...(params.mode
      ? {
          FilterExpression: '#mode = :mode',
        }
      : {}),
    ScanIndexForward: true,
  });

  return result.Items ?? [];
};
