import type { SubjectId } from '@smart-exam/api-types';

import { deleteCandidate } from './deleteCandidate';
import { listCandidatesByTargetId } from './listCandidatesByTargetId';

export const deleteCandidatesByTargetId = async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
  const items = await listCandidatesByTargetId({ targetId: params.targetId });
  const filtered = items.filter((x) => x.subject === params.subject);

  await Promise.all(
    filtered.map(async (item) => {
      await deleteCandidate({
        subject: item.subject,
        candidateKey: item.candidateKey,
      });
    }),
  );
};
