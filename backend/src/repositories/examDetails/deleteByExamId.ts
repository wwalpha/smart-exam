import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

import { listByExamId } from './listByExamId';

const TABLE_NAME = ENV.TABLE_EXAM_DETAILS;

export const deleteByExamId = async (examId: string): Promise<void> => {
  const rows = await listByExamId(examId);

  for (const row of rows) {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { examId: row.examId, seq: row.seq },
    });
  }
};
