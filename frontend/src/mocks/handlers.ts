import { http, HttpResponse } from 'msw'
import type {
  WordTestTitle,
  GradingValue,
  WordTestItem,
  WordTestSubject,
} from '@typings/wordtest'
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts'

type WordTestWithItems = WordTestTitle & {
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
    seed_items: [
      {
        qid: 'japanese_1',
        question:
          '祖母が足の<span class="text-blue-600 font-bold">しゅじゅつ</span>をした。',
        answer: '手術',
      },
    ],
  },
}

function clone_seed_items(subject: WordTestSubject): WordTestItem[] {
  return subject_definitions[subject].seed_items.map((x) => ({ ...x }))
}

function build_items(subject: WordTestSubject, count: number): WordTestItem[] {
  const seeds = clone_seed_items(subject)
  if (seeds.length === 0) return []

  const result: WordTestItem[] = []
  for (let index = 0; index < count; index += 1) {
    const seed = seeds[index % seeds.length]
    result.push({
      ...seed,
      qid: index < seeds.length ? seed.qid : `${seed.qid}_${index + 1}`,
    })
  }
  return result
}

let wordTests: WordTestWithItems[] = [
  {
    id: 'wt_1',
    name: `${SUBJECT_LABEL[SUBJECT.society]} 単語テスト 1`,
    subject: SUBJECT.society,
    createdAt: '2025-12-01T00:00:00.000Z',
    isGraded: false,
    items: clone_seed_items(SUBJECT.society),
  },
  {
    id: 'wt_2',
    name: `${SUBJECT_LABEL[SUBJECT.japanese]} 単語テスト 1`,
    subject: SUBJECT.japanese,
    createdAt: '2025-12-05T00:00:00.000Z',
    isGraded: false,
    items: clone_seed_items(SUBJECT.japanese),
  },
  {
    id: 'wt_3',
    name: `${SUBJECT_LABEL[SUBJECT.society]} 単語テスト 2`,
    subject: SUBJECT.society,
    createdAt: '2025-12-10T00:00:00.000Z',
    isGraded: true,
    items: clone_seed_items(SUBJECT.society).map((item, index) => ({
      ...item,
      grading: index % 2 === 0 ? '1' : '0',
    })),
  },
]

function toSummary(wordTest: WordTestWithItems): WordTestTitle {
  return {
    id: wordTest.id,
    name: wordTest.name,
    subject: wordTest.subject,
    createdAt: wordTest.createdAt,
    isGraded: wordTest.isGraded,
  }
}

export const handlers = [
  http.get('/api/wordtests', () => {
    return HttpResponse.json({
      datas: wordTests.map(toSummary),
    })
  }),

  http.post('/api/wordtests', async ({ request }) => {
    const body = (await request.json()) as { subject?: WordTestSubject; count?: number }

    if (!body.subject) {
      return new HttpResponse(null, { status: 400 })
    }

    if (typeof body.count !== 'number' || !Number.isFinite(body.count) || body.count < 1) {
      return new HttpResponse(null, { status: 400 })
    }

    const nextIndex =
      wordTests.filter((x) => x.subject === body.subject).length + 1

    const newItem: WordTestWithItems = {
      id: newId(),
      subject: body.subject,
      name: `${SUBJECT_LABEL[body.subject]} 単語テスト ${nextIndex}`,
      createdAt: new Date().toISOString(),
      isGraded: false,
      items: build_items(body.subject, body.count),
    }

    wordTests = [newItem, ...wordTests]

    return HttpResponse.json(toSummary(newItem))
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
        isGraded: true,
        items: nextItems,
      }
    })

    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/questions/search', () => {
    return HttpResponse.json([
      {
        id: '1',
        subject: '算数',
        unit: '速さ',
        questionText: '時速4kmで2時間歩くと何km進みますか？',
        sourceMaterialId: 'm1',
        sourceMaterialName: '第1回 週テスト',
      },
      {
        id: '2',
        subject: '理科',
        unit: '植物',
        questionText: '光合成に必要なものは何ですか？',
        sourceMaterialId: 'm2',
        sourceMaterialName: '第2回 週テスト',
      },
    ])
  }),
]
