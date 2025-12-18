import type { StateCreator } from 'zustand'
import type {
  ApplyWordTestGradingParams,
  CreateWordTestRequest,
  CreateWordTestResponse,
  WordTest,
  WordTestGradingValue,
  WordTestSubject,
} from '@typings/wordtest'

export type WordTestSlice = {
  wordTests: WordTest[]
  createWordTest: (request: CreateWordTestRequest) => CreateWordTestResponse
  wordTestGradings: Record<string, WordTestGradingValue[]>
  applyWordTestGrading: (params: ApplyWordTestGradingParams) => void
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function buildDefaultName(subject: WordTestSubject, index: number): string {
  return `${subject} 単語テスト ${index}`
}

export const createWordTestSlice: StateCreator<WordTestSlice, [], [], WordTestSlice> = (
  set,
  get,
) => ({
  wordTests: [
    {
      id: 'wt_1',
      name: buildDefaultName('社会', 1),
      subject: '社会',
      created_at: '2025-12-01T00:00:00.000Z',
      words: ['鎌倉幕府', '大化の改新', '参勤交代', '大政奉還'],
    },
    {
      id: 'wt_2',
      name: buildDefaultName('国語', 1),
      subject: '国語',
      created_at: '2025-12-05T00:00:00.000Z',
      words: ['枕草子', '徒然草', '竹取物語', '平家物語'],
    },
  ],
  wordTestGradings: {},
  createWordTest: (request) => {
    const nextIndex =
      get().wordTests.filter((x) => x.subject === request.subject).length + 1

    const newItem: WordTest = {
      id: newId(),
      subject: request.subject,
      name: buildDefaultName(request.subject, nextIndex),
      created_at: new Date().toISOString(),
      words: [],
    }

    set((state) => ({
      wordTests: [newItem, ...state.wordTests],
    }))

    return {
      wordTest: newItem,
    }
  },
  applyWordTestGrading: ({ wordTestId, grading }) => {
    set((state) => ({
      wordTestGradings: {
        ...state.wordTestGradings,
        [wordTestId]: grading,
      },
    }))
  },
})
