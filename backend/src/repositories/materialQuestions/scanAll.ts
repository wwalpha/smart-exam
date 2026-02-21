import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialQuestionsTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const scanAll = async (): Promise<MaterialQuestionsTable[]> => {
  const result = await dbHelper.scan<MaterialQuestionsTable>({
    TableName: TABLE_NAME,
  });

  return result.Items ?? [];
};
