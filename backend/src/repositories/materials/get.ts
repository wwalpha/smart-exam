import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const get = async (materialId: string): Promise<MaterialTable | null> => {
  const result = await dbHelper.get<MaterialTable>({
    TableName: TABLE_NAME,
    Key: { materialId },
  });
  return result?.Item || null;
};
