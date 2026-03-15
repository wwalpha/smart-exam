import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { KanjiTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_KANJI;
const INDEX_GSI_SUBJECT_WORD_ID = 'gsi_subject_word_id';

export const findByQuestionAnswer = async (params: {
  subject: SubjectId;
  question: string;
  answer: string;
}): Promise<KanjiTable | null> => {
  const result = await dbHelper.query<KanjiTable>({
    TableName: TABLE_NAME,
    IndexName: INDEX_GSI_SUBJECT_WORD_ID,
    KeyConditionExpression: '#subject = :subject',
    ExpressionAttributeNames: {
      '#subject': 'subject',
      '#question': 'question',
      '#answer': 'answer',
    },
    ExpressionAttributeValues: {
      ':subject': params.subject,
      ':question': params.question,
      ':answer': params.answer,
    },
    FilterExpression: '#question = :question AND #answer = :answer',
    Limit: 1,
  });

  return result.Items?.[0] ?? null;
};