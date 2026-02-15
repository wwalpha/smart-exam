import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAMS;

export const put = async (item: ExamTable): Promise<void> => {
  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
  });
};
