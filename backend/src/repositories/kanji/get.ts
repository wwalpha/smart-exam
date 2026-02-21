import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { KanjiTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_KANJI;

export const get = async (wordId: string): Promise<KanjiTable | null> => {
  const result = await dbHelper.get<KanjiTable>({
    TableName: TABLE_NAME,
    Key: { wordId },
  });
  return result?.Item || null;
};
