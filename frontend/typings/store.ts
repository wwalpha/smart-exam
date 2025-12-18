import type {
  ApplyWordTestGradingParams,
  CreateWordTestRequest,
  CreateWordTestResponse,
  GetWordTestRequest,
  ListWordTestsRequest,
  WordTest,
  WordTestGradingValue,
} from './wordtest'

export type WordTestState = {
  datas: WordTest[]
  wordTestGradings: Record<string, WordTestGradingValue[]>
}

export type WordTestSlice = {
  wordtest: WordTestState
  fetchWordTests: (request: ListWordTestsRequest) => Promise<void>
  fetchWordTest: (request: GetWordTestRequest) => Promise<WordTest | null>
  createWordTest: (request: CreateWordTestRequest) => Promise<CreateWordTestResponse>
  applyWordTestGrading: (params: ApplyWordTestGradingParams) => Promise<void>
}
