import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const bulkCreateCandidates = async (items: ExamCandidateTable[]): Promise<void> => {
  if (items.length === 0) return;
  await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
};
