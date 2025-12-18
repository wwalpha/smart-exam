import { http, HttpResponse } from 'msw'
import type {
  WordTest,
  GradingValue,
  WordTestItem,
  WordTestSubject,
} from '@typings/wordtest'
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts'

type WordTestWithItems = WordTest & {
  items: WordTestItem[]
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const subject_definitions: Record<WordTestSubject, { seed_items: WordTestItem[] }> = {
  [SUBJECT.society]: {
    seed_items: [
      { qid: 'society_1', question: '鎌倉幕府', answer: '鎌倉幕府' },
      { qid: 'society_2', question: '大化の改新', answer: '大化の改新' },
      { qid: 'society_3', question: '参勤交代', answer: '参勤交代' },
    ],
  },
  [SUBJECT.japanese]: {
    seed_items: [{ qid: 'japanese_1', question: '祖母が足のしゅじゅつをした。', answer: '手術' }],
  },
}

function clone_seed_items(subject: WordTestSubject): WordTestItem[] {
  return subject_definitions[subject].seed_items.map((x) => ({ ...x }))
}

let wordTests: WordTestWithItems[] = [
  {
    id: 'wt_1',
    name: `${SUBJECT_LABEL[SUBJECT.society]} 単語テスト 1`,
    subject: SUBJECT.society,
    created_at: '2025-12-01T00:00:00.000Z',
    is_graded: false,
    items: clone_seed_items(SUBJECT.society),
  },
  {
    id: 'wt_2',
    name: `${SUBJECT_LABEL[SUBJECT.japanese]} 単語テスト 1`,
    subject: SUBJECT.japanese,
    created_at: '2025-12-05T00:00:00.000Z',
    is_graded: false,
    items: clone_seed_items(SUBJECT.japanese),
  },
]

function toSummary(wordTest: WordTestWithItems): WordTest {
  return {
    id: wordTest.id,
    name: wordTest.name,
    subject: wordTest.subject,
    created_at: wordTest.created_at,
    is_graded: wordTest.is_graded,
  }
}

export const handlers = [
  http.get('/api/wordtests', () => {
    return HttpResponse.json({
      datas: wordTests.map(toSummary),
    })
  }),

  http.post('/api/wordtests', async ({ request }) => {
    const body = (await request.json()) as { subject?: WordTestSubject }

    if (!body.subject) {
      return new HttpResponse(null, { status: 400 })
    }

    const nextIndex =
      wordTests.filter((x) => x.subject === body.subject).length + 1

    const newItem: WordTestWithItems = {
      id: newId(),
      subject: body.subject,
      name: `${SUBJECT_LABEL[body.subject]} 単語テスト ${nextIndex}`,
      created_at: new Date().toISOString(),
      is_graded: false,
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
      id: found.id,
      items: found.items,
    })
  }),

  http.post('/api/wordtests/:wordTestId/grading', async ({ params, request }) => {
    const wordTestId = String(params.wordTestId)
    const found = wordTests.find((x) => x.id === wordTestId) ?? null

    if (!found) {
      return new HttpResponse(null, { status: 404 })
    }

    const body = (await request.json()) as {
      results?: Array<{ qid?: string; grading?: GradingValue }>
    }

    if (!Array.isArray(body.results)) {
      return new HttpResponse(null, { status: 400 })
    }

    const gradingByQid = new Map<string, GradingValue>()
    for (const x of body.results) {
      if (!x?.qid || x.grading === undefined) {
        return new HttpResponse(null, { status: 400 })
      }
      gradingByQid.set(x.qid, x.grading)
    }

    const nextGrading = found.items.map((item) => gradingByQid.get(item.qid))
    if (nextGrading.some((x) => x === undefined)) {
      return new HttpResponse(null, { status: 400 })
    }

    wordTests = wordTests.map((x) => {
      if (x.id !== wordTestId) return x

      const nextItems = x.items.map((item, index) => ({
        ...item,
        grading: nextGrading[index],
      }))

      return {
        ...x,
        is_graded: true,
        items: nextItems,
      }
    })

    return HttpResponse.json({
      ok: true,
    })
  }),
]
