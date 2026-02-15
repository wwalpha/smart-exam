import type { SubjectId } from '@smart-exam/api-types';

import { deleteCandidate } from './deleteCandidate';
import { getLatestOpenCandidateByTargetId } from './getLatestOpenCandidateByTargetId';

export const deleteLatestOpenCandidateByTargetId = async (params: {
  subject: SubjectId;
  targetId: string;
}): Promise<void> => {
  const open = await getLatestOpenCandidateByTargetId({
    subject: params.subject,
    targetId: params.targetId,
  });
  if (!open) return;

  await deleteCandidate({
    subject: params.subject,
    candidateKey: open.candidateKey,
  });
};
