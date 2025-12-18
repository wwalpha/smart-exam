import type {
  CreateWordTestResponse,
  WordTest,
  WordTestDetail,
  WordTestGradingValue,
  WordTestSubject,
} from './wordtest'

export type ApiStatus = {
  isLoading: boolean
  error: string | null
}

export type WordTestState = {
  datas: WordTest[]
  details: Record<string, WordTestDetail>
  gradings: Record<string, WordTestGradingValue[]>
  status: ApiStatus
}

export type WordTestSlice = {
  wordtest: WordTestState
  fetchWordTests: () => Promise<void>
  fetchWordTest: (wordTestId: string) => Promise<WordTest | null>
  createWordTest: (subject: WordTestSubject) => Promise<CreateWordTestResponse>
  applyWordTestGrading: (wordTestId: string, grading: WordTestGradingValue[]) => Promise<void>
}
