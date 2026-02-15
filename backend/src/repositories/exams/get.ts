import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAMS;

export const get = async (testId: string): Promise<ExamTable | null> => {
  const result = await dbHelper.get<ExamTable>({
    TableName: TABLE_NAME,
    Key: { testId },
  });
  return result?.Item ?? null;
};
