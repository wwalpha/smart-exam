import type { SubjectId } from '@smart-exam/api-types';

import { closeCandidateIfMatch } from './closeCandidateIfMatch';
import { getLatestOpenCandidateByTargetId } from './getLatestOpenCandidateByTargetId';

export const deleteOpenCandidatesByTargetId = async (params: {
  subject: SubjectId;
  targetId: string;
}): Promise<void> => {
  const open = await getLatestOpenCandidateByTargetId({
    subject: params.subject,
    targetId: params.targetId,
  });
  if (!open) return;

  await closeCandidateIfMatch({
    subject: params.subject,
    candidateKey: open.candidateKey,
  });
};
