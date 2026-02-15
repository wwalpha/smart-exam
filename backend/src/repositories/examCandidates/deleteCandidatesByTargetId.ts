import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

import { listCandidatesByTargetId } from './listCandidatesByTargetId';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const deleteCandidatesByTargetId = async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
  const items = await listCandidatesByTargetId({ targetId: params.targetId });
  const filtered = items.filter((x) => x.subject === params.subject);

  await Promise.all(
    filtered.map(async (item) => {
      await dbHelper.delete({
        TableName: TABLE_NAME,
        Key: { subject: item.subject, candidateKey: item.candidateKey },
      });
    }),
  );
};
