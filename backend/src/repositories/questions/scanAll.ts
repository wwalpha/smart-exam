import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const scanAll = async (): Promise<MaterialQuestionTable[]> => {
  const result = await dbHelper.scan<MaterialQuestionTable>({
    TableName: TABLE_NAME,
  });
  return result.Items || [];
};
