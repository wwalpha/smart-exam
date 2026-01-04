import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { ExamPaperTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_EXAM_PAPERS;

export const ExamPapersService = {
  create: async (item: ExamPaperTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  list: async (): Promise<ExamPaperTable[]> => {
    const result = await dbHelper.scan<ExamPaperTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  }
};
