import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { TestTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_TESTS;

export const TestsService = {
  create: async (item: TestTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  get: async (testId: string): Promise<TestTable | null> => {
    const result = await dbHelper.get<TestTable>({
      TableName: TABLE_NAME,
      Key: { testId },
    });
    return result?.Item || null;
  },

  list: async (): Promise<TestTable[]> => {
    const result = await dbHelper.scan<TestTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  },
};
