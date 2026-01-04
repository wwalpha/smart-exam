import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { WordTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_WORDS;

export const WordsService = {
  create: async (item: WordTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  listKanji: async (): Promise<WordTable[]> => {
    const result = await dbHelper.scan<WordTable>({
      TableName: TABLE_NAME,
      FilterExpression: '#wordType = :wordType',
      ExpressionAttributeNames: { '#wordType': 'wordType' },
      ExpressionAttributeValues: { ':wordType': 'KANJI' },
    });
    return result.Items || [];
  }
};
