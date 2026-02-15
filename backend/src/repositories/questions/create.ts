import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const create = async (item: MaterialQuestionTable): Promise<void> => {
  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
  });
};
