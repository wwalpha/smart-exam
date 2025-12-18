import { http, HttpResponse } from 'msw'
import type { WordTest, WordTestGradingValue, WordTestSubject } from '@typings/wordtest'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

let wordTests: WordTest[] = [
  {
    id: 'wt_1',
    name: '社会 単語テスト 1',
    subject: '社会',
    created_at: '2025-12-01T00:00:00.000Z',
    words: ['鎌倉幕府', '大化の改新', '参勤交代', '大政奉還'],
  },
  {
    id: 'wt_2',
    name: '国語 単語テスト 1',
    subject: '国語',
    created_at: '2025-12-05T00:00:00.000Z',
    words: ['枕草子', '徒然草', '竹取物語', '平家物語'],
  },
]

let wordTestGradings: Record<string, WordTestGradingValue[]> = {}

export const handlers = [
  http.get('/api/wordtests', () => {
    return HttpResponse.json({
      wordTests,
    })
  }),

  http.post('/api/wordtests', async ({ request }) => {
    const body = (await request.json()) as { subject?: WordTestSubject }

    if (!body.subject) {
      return new HttpResponse(null, { status: 400 })
    }

    const nextIndex =
      wordTests.filter((x) => x.subject === body.subject).length + 1

    const newItem: WordTest = {
      id: newId(),
      subject: body.subject,
      name: `${body.subject} 単語テスト ${nextIndex}`,
      created_at: new Date().toISOString(),
      words: [],
    }

    wordTests = [newItem, ...wordTests]

    return HttpResponse.json({
      wordTest: newItem,
    })
  }),

  http.get('/api/wordtests/:wordTestId', ({ params }) => {
    const wordTestId = String(params.wordTestId)
    const found = wordTests.find((x) => x.id === wordTestId) ?? null

    if (!found) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json({
      wordTest: found,
      grading: wordTestGradings[wordTestId] ?? null,
    })
  }),

  http.put('/api/wordtests/:wordTestId/grading', async ({ params, request }) => {
    const wordTestId = String(params.wordTestId)
    const found = wordTests.find((x) => x.id === wordTestId) ?? null

    if (!found) {
      return new HttpResponse(null, { status: 404 })
    }

    const body = (await request.json()) as {
      wordTestId?: string
      grading?: WordTestGradingValue[]
    }

    if (!body.wordTestId || !Array.isArray(body.grading)) {
      return new HttpResponse(null, { status: 400 })
    }

    wordTestGradings = {
      ...wordTestGradings,
      [wordTestId]: body.grading,
    }

    return HttpResponse.json({
      ok: true,
    })
  }),
]
