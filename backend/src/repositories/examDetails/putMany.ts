import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamDetailTable } from '@/types/db';
import type { ReviewMode } from '@smart-exam/api-types';

const TABLE_NAME = ENV.TABLE_EXAM_DETAILS;

export const putMany = async (examId: string, targetIds: string[], targetType: ReviewMode): Promise<ExamDetailTable[]> => {
  const items: ExamDetailTable[] = targetIds.map((targetId, seq) => ({
    examId,
    seq,
    targetType,
    targetId,
  }));

  if (items.length === 0) {
    return [];
  }

  await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
  return items;
};
