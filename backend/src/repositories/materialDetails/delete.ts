import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_MATERIAL_DETAILS;

export const remove = async (questionId: string): Promise<void> => {
  await dbHelper.delete({
    TableName: TABLE_NAME,
    Key: { questionId },
  });
};
