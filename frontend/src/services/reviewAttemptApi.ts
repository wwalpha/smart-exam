import { apiRequest } from './apiClient';
import type {
  ListReviewAttemptsResponse,
  UpsertReviewAttemptRequest,
  UpsertReviewAttemptResponse,
} from '@smart-exam/api-types';

export const listReviewAttempts = async (params: {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
}): Promise<ListReviewAttemptsResponse> => {
  const qs = new URLSearchParams({ targetType: params.targetType, targetId: params.targetId });
  return apiRequest<ListReviewAttemptsResponse>({
    method: 'GET',
    path: `/api/review-attempts?${qs.toString()}`,
  });
};

export const upsertReviewAttempt = async (
  request: UpsertReviewAttemptRequest
): Promise<UpsertReviewAttemptResponse> => {
  return apiRequest<UpsertReviewAttemptResponse, UpsertReviewAttemptRequest>({
    method: 'PUT',
    path: '/api/review-attempts',
    body: request,
  });
};
