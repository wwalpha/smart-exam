import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { WordMasterTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_WORD_MASTER;

export const get = async (wordId: string): Promise<WordMasterTable | null> => {
  const result = await dbHelper.get<WordMasterTable>({
    TableName: TABLE_NAME,
    Key: { wordId },
  });
  return result?.Item || null;
};
