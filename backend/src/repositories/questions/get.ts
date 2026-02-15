import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const get = async (questionId: string): Promise<MaterialQuestionTable | null> => {
  const result = await dbHelper.get<MaterialQuestionTable>({
    TableName: TABLE_NAME,
    Key: { questionId },
  });
  return result?.Item || null;
};
