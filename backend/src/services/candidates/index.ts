import type { Repositories } from '@/repositories/createRepositories';

import { createCandidateSearch } from './candidateSearch';
import type { CandidatesService } from './candidates.types';

export type { CandidatesService } from './candidates.types';

export const createCandidatesService = (repositories: Repositories): CandidatesService => {
  const candidateSearch = createCandidateSearch(repositories);

  return {
    candidateSearch,
  };
};

export { createCandidatesService as candidatesService };