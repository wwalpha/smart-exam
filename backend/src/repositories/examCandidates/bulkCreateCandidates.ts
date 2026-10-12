import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';
import { putMaterialCandidate } from '@/repositories/materialReviews/candidates';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const bulkCreateCandidates = async (items: ExamCandidateTable[]): Promise<void> => {
  if (items.length === 0) return;
  for (const item of items.filter((c) => c.mode === 'MATERIAL')) await putMaterialCandidate(item);
  const kanji = items.filter((c) => c.mode === 'KANJI');
  if (kanji.length) await dbHelper.bulk(TABLE_NAME, kanji as unknown as Record<string, unknown>[]);
};
