import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_EXAMS;

export const remove = async (testId: string): Promise<void> => {
  await dbHelper.delete({
    TableName: TABLE_NAME,
    Key: { testId },
  });
};
