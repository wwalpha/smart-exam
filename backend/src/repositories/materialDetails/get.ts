import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialDetailsTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_DETAILS;

export const get = async (questionId: string): Promise<MaterialDetailsTable | null> => {
  const result = await dbHelper.get<MaterialDetailsTable>({
    TableName: TABLE_NAME,
    Key: { questionId },
  });

  return result?.Item ?? null;
};
