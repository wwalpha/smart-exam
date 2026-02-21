import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { WordMasterTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_WORD_MASTER;

export const bulkCreate = async (items: WordMasterTable[]): Promise<void> => {
  if (items.length === 0) return;
  await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
};
