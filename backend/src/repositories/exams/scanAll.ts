import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAMS;

export const scanAll = async (): Promise<ExamTable[]> => {
  const result = await dbHelper.scan<ExamTable>({
    TableName: TABLE_NAME,
  });
  return result.Items ?? [];
};
