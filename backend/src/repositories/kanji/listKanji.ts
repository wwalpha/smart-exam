import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { KanjiTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_KANJI;

export const listKanji = async (subject?: SubjectId): Promise<KanjiTable[]> => {
  if (subject) {
    const result = await dbHelper.query<KanjiTable>({
      TableName: TABLE_NAME,
      IndexName: 'gsi_subject_word_id',
      KeyConditionExpression: '#subject = :subject',
      ExpressionAttributeNames: { '#subject': 'subject' },
      ExpressionAttributeValues: { ':subject': subject },
    });
    return result.Items || [];
  }

  const result = await dbHelper.scan<KanjiTable>({
    TableName: TABLE_NAME,
  });
  return result.Items || [];
};
