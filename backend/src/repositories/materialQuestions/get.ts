import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialQuestionsTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const get = async (questionId: string): Promise<MaterialQuestionsTable | null> => {
  const result = await dbHelper.get<MaterialQuestionsTable>({
    TableName: TABLE_NAME,
    Key: { questionId },
  });

  return result?.Item ?? null;
};
