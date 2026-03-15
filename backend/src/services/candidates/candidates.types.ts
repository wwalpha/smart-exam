import type { CandidateSearchRequest, CandidateSearchResult } from '@smart-exam/api-types';

export type CandidatesService = {
  // 条件に一致する候補を横断検索する。
  candidateSearch: (params: CandidateSearchRequest) => Promise<CandidateSearchResult[]>;
};