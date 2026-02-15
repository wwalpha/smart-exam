import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamDetailTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_EXAM_DETAILS;

export const putMany = async (examId: string, targetIds: string[]): Promise<ExamDetailTable[]> => {
  const items: ExamDetailTable[] = targetIds.map((targetId, seq) => ({
    examId,
    seq,
    targetId,
  }));

  if (items.length === 0) {
    return [];
  }

  await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
  return items;
};
