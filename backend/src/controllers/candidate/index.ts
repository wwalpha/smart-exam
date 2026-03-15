import type { Services } from '@/services/createServices';

import { CandidateSearchBodySchema } from './candidate.schema';
import { candidateSearch } from './candidateSearch';

export const candidateController = (services: Services) => {
  return {
    CandidateSearchBodySchema,
    candidateSearch: candidateSearch(services),
  };
};
