import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { KanjiTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_KANJI;

export const create = async (item: KanjiTable): Promise<void> => {
  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
  });
};
