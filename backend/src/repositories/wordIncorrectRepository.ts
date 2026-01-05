import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { WordIncorrectTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_WORD_INCORRECTS;
const GSI_SUBJECT_LAST_INCORRECT_AT = 'gsi_subject_last_incorrect_at';

export const WordIncorrectRepository = {
  upsertLastIncorrectAt: async (input: {
    wordId: string;
    subject: string;
    occurredAt: string;
  }): Promise<void> => {
    try {
      await dbHelper.update({
        TableName: TABLE_NAME,
        Key: { wordId: input.wordId },
        UpdateExpression: 'SET #subject = :subject, #lastIncorrectAt = :occurredAt',
        ExpressionAttributeNames: {
          '#subject': 'subject',
          '#lastIncorrectAt': 'lastIncorrectAt',
        },
        ExpressionAttributeValues: {
          ':subject': input.subject,
          ':occurredAt': input.occurredAt,
        },
        ConditionExpression: 'attribute_not_exists(#lastIncorrectAt) OR #lastIncorrectAt < :occurredAt',
      });
    } catch (e) {
      // 既により新しい記録がある場合は更新しない
      if (e && typeof e === 'object' && 'name' in e && (e as any).name === 'ConditionalCheckFailedException') {
        return;
      }
      throw e;
    }
  },

  listRecentIncorrects: async (limit: number): Promise<WordIncorrectTable[]> => {
    // DynamoDB で全subject横断の効率的な並び替えはできないため、まずは全件を取得し、アプリ側で降順ソートする
    const result = await dbHelper.scan<WordIncorrectTable>({
      TableName: TABLE_NAME,
    });

    return (result.Items ?? [])
      .slice()
      .sort((a, b) => (a.lastIncorrectAt < b.lastIncorrectAt ? 1 : a.lastIncorrectAt > b.lastIncorrectAt ? -1 : 0))
      .slice(0, limit);
  },

  listRecentIncorrectsBySubject: async (subject: string, limit: number): Promise<WordIncorrectTable[]> => {
    const result = await dbHelper.query<WordIncorrectTable>({
      TableName: TABLE_NAME,
      IndexName: GSI_SUBJECT_LAST_INCORRECT_AT,
      KeyConditionExpression: '#subject = :subject',
      ExpressionAttributeNames: {
        '#subject': 'subject',
      },
      ExpressionAttributeValues: {
        ':subject': subject,
      },
      ScanIndexForward: false,
      Limit: limit,
    });

    return result.Items ?? [];
  },
};
