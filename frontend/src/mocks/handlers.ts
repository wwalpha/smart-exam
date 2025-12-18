import { http, HttpResponse } from 'msw'
import type {
  WordTest,
  WordTestDetail,
  WordTestGradingValue,
  WordTestItem,
  WordTestSubject,
} from '@typings/wordtest'
import { subject, SubjectLabel } from '@/lib/Consts'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const subject_definitions: Record<WordTestSubject, { seed_items: WordTestItem[] }> = {
  [subject.society]: {
    seed_items: [
      { question: '鎌倉幕府', answer: '鎌倉幕府' },
      { question: '大化の改新', answer: '大化の改新' },
      { question: '参勤交代', answer: '参勤交代' },
    ],
  },
  [subject.japanese]: {
    seed_items: [{ question: '祖母が足のしゅじゅつをした。', answer: '手術' }],
  },
}

function clone_seed_items(subject: WordTestSubject): WordTestItem[] {
  return subject_definitions[subject].seed_items.map((x) => ({ ...x }))
}

let wordTests: WordTestDetail[] = [
  {
    id: 'wt_1',
    name: `${SubjectLabel[subject.society]} 単語テスト 1`,
    subject: subject.society,
    created_at: '2025-12-01T00:00:00.000Z',
    items: clone_seed_items(subject.society),
  },
  {
    id: 'wt_2',
    name: `${SubjectLabel[subject.japanese]} 単語テスト 1`,
    subject: subject.japanese,
    created_at: '2025-12-05T00:00:00.000Z',
    items: clone_seed_items(subject.japanese),
  },
]

function toSummary(wordTest: WordTestDetail): WordTest {
  return {
    id: wordTest.id,
    name: wordTest.name,
    subject: wordTest.subject,
    created_at: wordTest.created_at,
  }
}

let wordTestGradings: Record<string, WordTestGradingValue[]> = {}

export const handlers = [
  http.get('/api/wordtests', () => {
    return HttpResponse.json({
      wordTests: wordTests.map(toSummary),
    })
  }),

  http.post('/api/wordtests', async ({ request }) => {
    const body = (await request.json()) as { subject?: WordTestSubject }

    if (!body.subject) {
      return new HttpResponse(null, { status: 400 })
    }

    const nextIndex =
      wordTests.filter((x) => x.subject === body.subject).length + 1

    const newItem: WordTestDetail = {
      id: newId(),
      subject: body.subject,
      name: `${SubjectLabel[body.subject]} 単語テスト ${nextIndex}`,
      created_at: new Date().toISOString(),
      items: clone_seed_items(body.subject),
    }

    wordTests = [newItem, ...wordTests]

    return HttpResponse.json({
      wordTest: toSummary(newItem),
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
