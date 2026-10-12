import type { MaterialQuestionsTable } from '@/types/db';
import { create } from './create';

export const bulkCreate = async (items: MaterialQuestionsTable[]): Promise<void> => {
  for (const item of items) await create(item);
};
