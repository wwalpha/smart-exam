import type { SearchReviewTestsResponse } from '@smart-exam/api-types';

import type { ReviewTestsService } from './createExamsService';

export const createSearchReviewTests = (deps: {
  listExams: ReviewTestsService['listExams'];
}): ReviewTestsService['searchExams'] => {
  return async (params): Promise<SearchReviewTestsResponse> => {
    const items = await deps.listExams();

    const filtered = items.filter((x) => {
      if (x.mode !== params.mode) return false;
      if (params.subject !== 'ALL' && x.subject !== params.subject) return false;
      if (params.status && params.status !== 'ALL' && x.status !== params.status) return false;
      return true;
    });

    return { items: filtered, total: filtered.length };
  };
};
