import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { WordTestTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_WORD_TESTS;

export const WordTestsService = {
  create: async (item: WordTestTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  list: async (): Promise<WordTestTable[]> => {
    const result = await dbHelper.scan<WordTestTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  },

  get: async (wordTestId: string): Promise<WordTestTable | null> => {
    const result = await dbHelper.get<WordTestTable>({
      TableName: TABLE_NAME,
      Key: { wordTestId },
    });
    return result?.Item || null;
  },
};
