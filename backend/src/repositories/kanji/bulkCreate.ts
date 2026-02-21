import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { KanjiTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_KANJI;

export const bulkCreate = async (items: KanjiTable[]): Promise<void> => {
  if (items.length === 0) return;
  await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
};
