import type {
  ApplyWordTestGradingRequest,
  ApplyWordTestGradingResponse,
  CreateWordTestRequest,
  CreateWordTestResponse,
  GetWordTestRequest,
  GetWordTestResponse,
  ListWordTestsRequest,
  ListWordTestsResponse,
} from '@typings/wordtest'
import { apiRequest } from '@/services/apiClient'

export async function listWordTests(
  request?: ListWordTestsRequest,
): Promise<ListWordTestsResponse> {
  void request
  return apiRequest<ListWordTestsResponse>({
    method: 'GET',
    path: '/api/wordtests',
  })
}

export async function getWordTest(
  request: GetWordTestRequest,
): Promise<GetWordTestResponse> {
  return apiRequest<GetWordTestResponse>({
    method: 'GET',
    path: `/api/wordtests/${request.wordTestId}`,
  })
}

export async function createWordTest(
  request: CreateWordTestRequest,
): Promise<CreateWordTestResponse> {
  return apiRequest<CreateWordTestResponse, CreateWordTestRequest>({
    method: 'POST',
    path: '/api/wordtests',
    body: request,
  })
}

export async function applyWordTestGrading(
  request: ApplyWordTestGradingRequest,
): Promise<ApplyWordTestGradingResponse> {
  return apiRequest<ApplyWordTestGradingResponse, ApplyWordTestGradingRequest>({
    method: 'PUT',
    path: `/api/wordtests/${request.wordTestId}/grading`,
    body: request,
  })
}
