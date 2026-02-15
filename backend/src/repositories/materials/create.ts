import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const create = async (item: MaterialTable): Promise<void> => {
  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
  });
};
