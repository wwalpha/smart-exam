import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

export const createDeleteManyKanji = (repositories: Repositories): KanjiService['deleteManyKanji'] => {
  return async (ids): Promise<void> => {
    const uniqueIds = Array.from(new Set(ids.map((x) => x.trim()).filter((x) => x.length > 0)));
    for (const id of uniqueIds) {
      const existing = await repositories.wordMaster.get(id);
      if (!existing) continue;

      await repositories.reviewTestCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
      await repositories.wordMaster.delete(id);
    }
  };
};
