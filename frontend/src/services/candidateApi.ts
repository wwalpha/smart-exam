import { apiRequest } from './apiClient';
import type { CandidateSearchRequest, CandidateSearchResponse } from '@smart-exam/api-types';

export const candidateSearch = async (request: CandidateSearchRequest): Promise<CandidateSearchResponse> => {
  return apiRequest<CandidateSearchResponse, CandidateSearchRequest>({
    method: 'POST',
    path: '/api/candidates/search',
    body: request,
  });
};