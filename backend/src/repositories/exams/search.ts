import type { ExamMode, SearchExamsRequest } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAMS;

const normalizeStatus = (status?: SearchExamsRequest['status']): ExamTable['status'] | null => {
  if (!status || status === 'ALL') return null;
  return status;
};

export const search = async (params: {
  mode: ExamMode;
  subject?: SearchExamsRequest['subject'];
  status?: SearchExamsRequest['status'];
}): Promise<ExamTable[]> => {
  const expressionAttributeNames: Record<string, string> = {
    '#mode': 'mode',
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ':mode': params.mode,
  };
  const filters: string[] = ['#mode = :mode'];

  if (params.subject && params.subject !== 'ALL') {
    expressionAttributeNames['#subject'] = 'subject';
    expressionAttributeValues[':subject'] = params.subject;
    filters.push('#subject = :subject');
  }

  const normalizedStatus = normalizeStatus(params.status);
  if (normalizedStatus) {
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = normalizedStatus;
    filters.push('#status = :status');
  }

  const result = await dbHelper.scan<ExamTable>({
    TableName: TABLE_NAME,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    FilterExpression: filters.join(' AND '),
  });

  return result.Items ?? [];
};
