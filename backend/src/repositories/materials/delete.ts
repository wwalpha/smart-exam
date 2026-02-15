import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const remove = async (materialId: string): Promise<void> => {
  await dbHelper.delete({
    TableName: TABLE_NAME,
    Key: { materialId },
  });
};
