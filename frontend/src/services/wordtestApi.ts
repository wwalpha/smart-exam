import type {
  ApplyWordTestGradingRequest,
  ApplyWordTestGradingResponse,
  CreateWordTestRequest,
  CreateWordTestResponse,
  GetWordTestDetailRequest,
  GetWordTestDetailResponse,
  ListWordTestsRequest,
  ListWordTestsResponse,
} from '@typings/wordtest'
import { apiRequest } from '@/services/apiClient'

export const listWordTests = async (
  request?: ListWordTestsRequest,
): Promise<ListWordTestsResponse> => {
  void request
  return apiRequest<ListWordTestsResponse>({
    method: 'GET',
    path: '/api/wordtests',
  })
}

export const getWordTest = async (
  request: GetWordTestDetailRequest,
): Promise<GetWordTestDetailResponse> => {
  return apiRequest<GetWordTestDetailResponse>({
    method: 'GET',
    path: `/api/wordtests/${request.wordTestId}`,
  })
}

export const createWordTest = async (
  request: CreateWordTestRequest,
): Promise<CreateWordTestResponse> => {
  return apiRequest<CreateWordTestResponse, CreateWordTestRequest>({
    method: 'POST',
    path: '/api/wordtests',
    body: request,
  })
}

export const applyWordTestGrading = async (
  wordTestId: string,
  request: ApplyWordTestGradingRequest,
): Promise<ApplyWordTestGradingResponse> => {
  return apiRequest<ApplyWordTestGradingResponse, ApplyWordTestGradingRequest>({
    method: 'POST',
    path: `/api/wordtests/${wordTestId}/grading`,
    body: request,
  })
}
