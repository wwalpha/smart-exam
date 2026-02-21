import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialDetailsTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_DETAILS;

export const scanAll = async (): Promise<MaterialDetailsTable[]> => {
  const result = await dbHelper.scan<MaterialDetailsTable>({
    TableName: TABLE_NAME,
  });

  return result.Items ?? [];
};
