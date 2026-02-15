import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const list = async (): Promise<MaterialTable[]> => {
  const result = await dbHelper.scan<MaterialTable>({
    TableName: TABLE_NAME,
  });
  return result.Items || [];
};
