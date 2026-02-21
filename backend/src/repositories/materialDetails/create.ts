import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialDetailsTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_DETAILS;

export const create = async (item: MaterialDetailsTable): Promise<void> => {
  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
  });
};
