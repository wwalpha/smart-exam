import type { SearchMaterialsRequest } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const search = async (params: SearchMaterialsRequest): Promise<MaterialTable[]> => {
  const subject = (params.subject ?? '').trim();
  const grade = (params.grade ?? '').trim();
  const provider = (params.provider ?? '').trim();
  const from = (params.from ?? '').trim();
  const to = (params.to ?? '').trim();
  const q = (params.q ?? '').trim();

  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};
  const filters: string[] = [];

  if (grade) {
    expressionAttributeNames['#grade'] = 'grade';
    expressionAttributeValues[':grade'] = grade;
    filters.push('#grade = :grade');
  }

  if (provider) {
    expressionAttributeNames['#provider'] = 'provider';
    expressionAttributeValues[':provider'] = provider;
    filters.push('#provider = :provider');
  }

  if (from) {
    expressionAttributeNames['#materialDate'] = 'materialDate';
    expressionAttributeValues[':from'] = from;
    filters.push('#materialDate >= :from');
  }

  if (to) {
    expressionAttributeNames['#materialDate'] = 'materialDate';
    expressionAttributeValues[':to'] = to;
    filters.push('#materialDate <= :to');
  }

  if (q) {
    expressionAttributeNames['#title'] = 'title';
    expressionAttributeNames['#provider'] = 'provider';
    expressionAttributeNames['#materialDate'] = 'materialDate';
    expressionAttributeValues[':q'] = q;
    filters.push('(contains(#title, :q) OR contains(#provider, :q) OR contains(#materialDate, :q))');
  }

  const filterExpression = filters.length > 0 ? filters.join(' AND ') : undefined;

  if (subject) {
    const result = await dbHelper.query<MaterialTable>({
      TableName: TABLE_NAME,
      IndexName: 'gsi_subject_id',
      KeyConditionExpression: '#subjectId = :subjectId',
      ExpressionAttributeNames: {
        '#subjectId': 'subjectId',
        ...expressionAttributeNames,
      },
      ExpressionAttributeValues: {
        ':subjectId': subject,
        ...expressionAttributeValues,
      },
      ...(filterExpression ? { FilterExpression: filterExpression } : {}),
    });

    return result.Items ?? [];
  }

  const scanResult = await dbHelper.scan<MaterialTable>({
    TableName: TABLE_NAME,
    ...(Object.keys(expressionAttributeNames).length > 0 ? { ExpressionAttributeNames: expressionAttributeNames } : {}),
    ...(Object.keys(expressionAttributeValues).length > 0
      ? { ExpressionAttributeValues: expressionAttributeValues }
      : {}),
    ...(filterExpression ? { FilterExpression: filterExpression } : {}),
  });

  return scanResult.Items ?? [];
};
