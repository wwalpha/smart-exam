export type WordTestSubject = '社会' | '国語'

export type WordTest = {
  id: string
  name: string
  subject: WordTestSubject
  created_at: string
  words: string[]
}

export type WordTestGradingValue = 'correct' | 'incorrect'

export type ApplyWordTestGradingParams = {
  wordTestId: string
  grading: WordTestGradingValue[]
}

export type ListWordTestsRequest = Record<string, never>

export type ListWordTestsResponse = {
  wordTests: WordTest[]
}

export type GetWordTestRequest = {
  wordTestId: string
}

export type GetWordTestResponse = {
  wordTest: WordTest
  grading: WordTestGradingValue[] | null
}

export type ApplyWordTestGradingRequest = ApplyWordTestGradingParams

export type ApplyWordTestGradingResponse = {
  ok: true
}

export type CreateWordTestRequest = {
  subject: WordTestSubject
}

export type CreateWordTestResponse = {
  wordTest: WordTest
}
