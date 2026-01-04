import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { ExamResultTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_EXAM_RESULTS;

export const ExamResultsService = {
  create: async (item: ExamResultTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  list: async (): Promise<ExamResultTable[]> => {
    const result = await dbHelper.scan<ExamResultTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  }
};
