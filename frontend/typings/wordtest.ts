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

export type CreateWordTestRequest = {
  subject: WordTestSubject
}

export type CreateWordTestResponse = {
  wordTest: WordTest
}
