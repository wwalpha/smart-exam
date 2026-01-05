import { apiRequest } from './apiClient';
import type { AnalyzePaperRequest, AnalyzePaperResponse } from '@smart-exam/api-types';

export const analyzePaper = async (request: AnalyzePaperRequest): Promise<AnalyzePaperResponse> => {
  return apiRequest<AnalyzePaperResponse, AnalyzePaperRequest>({
    method: 'POST',
    path: '/api/analyze-paper',
    body: request,
  });
};
