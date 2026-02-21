import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_KANJI;

export const remove = async (wordId: string): Promise<void> => {
  await dbHelper.delete({
    TableName: TABLE_NAME,
    Key: { wordId },
  });
};
