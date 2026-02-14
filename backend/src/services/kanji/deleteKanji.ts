import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

export const createDeleteKanji = (repositories: Repositories): KanjiService['deleteKanji'] => {
  return async (id): Promise<boolean> => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) return false;

    await repositories.reviewTestCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
    await repositories.wordMaster.delete(id);
    return true;
  };
};
