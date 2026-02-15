import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { WordMasterTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_WORD_MASTER;

export const create = async (item: WordMasterTable): Promise<void> => {
  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
  });
};
