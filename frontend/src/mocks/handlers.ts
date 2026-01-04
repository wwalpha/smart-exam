import { http, HttpResponse } from 'msw';
import type {
  AnalyzePaperRequest,
  AnalyzePaperResponse,
  Attempt,
  CreateAttemptRequest,
  CreateAttemptResponse,
  CreateExamPaperRequest,
  CreateExamResultRequest,
  CreateKanjiRequest,
  CreateKanjiResponse,
  CreateMaterialSetRequest,
  CreateReviewTestRequest,
  CreateReviewTestResponse,
  CreateQuestionRequest,
  CreateQuestionResponse,
  CreateWordTestRequest,
  CreateWordTestResponse,
  DashboardData,
  ExamPaper,
  ExamResult,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
  Kanji,
  MaterialSet,
  MaterialSetListResponse,
  Question,
  QuestionListResponse,
  ReviewTest,
  ReviewTestDetail,
  ReviewTestListResponse,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
  SubmitReviewTestResultsRequest,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  UpdateReviewTestStatusRequest,
  WordTestTitle,
} from '@smart-exam/api-types';
import type { GradingValue, WordTestItem, WordTestSubject } from '@typings/wordtest';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';

type WordTestWithItems = WordTestTitle & {
  items: WordTestItem[];
};

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso(): string {
  return new Date().toISOString();
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
        question: '祖母が足の<span class="text-blue-600 font-bold">しゅじゅつ</span>をした。',
        answer: '手術',
      },
    ],
  },
};

function clone_seed_items(subject: WordTestSubject): WordTestItem[] {
  return subject_definitions[subject].seed_items.map((x) => ({ ...x }));
}

function build_items(subject: WordTestSubject, count: number): WordTestItem[] {
  const seeds = clone_seed_items(subject);
  if (seeds.length === 0) return [];

  const result: WordTestItem[] = [];
  for (let index = 0; index < count; index += 1) {
    const seed = seeds[index % seeds.length];
    result.push({
      ...seed,
      qid: index < seeds.length ? seed.qid : `${seed.qid}_${index + 1}`,
    });
  }
  return result;
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
];

function toSummary(wordTest: WordTestWithItems): WordTestTitle {
  return {
    id: wordTest.id,
    name: wordTest.name,
    subject: wordTest.subject,
    createdAt: wordTest.createdAt,
    isGraded: wordTest.isGraded,
  };
}

let uploadedObjects = new Set<string>();

let examPapers: ExamPaper[] = [
  {
    paperId: 'paper_1',
    grade: '6',
    subject: 'math',
    category: 'mock',
    name: 'Mock Exam Paper',
    questionPdfKey: 'uploads/mock-question.pdf',
    answerPdfKey: 'uploads/mock-answer.pdf',
    createdAt: '2025-12-01T00:00:00.000Z',
  },
];

let examResults: ExamResult[] = [];

let materialSets: MaterialSet[] = [
  {
    id: 'mat_1',
    name: 'Mock Material Set',
    subject: 'math',
    date: '2025-12-01',
    createdAt: '2025-12-01T00:00:00.000Z',
    updatedAt: '2025-12-01T00:00:00.000Z',
  },
];

let questionsByMaterialSetId: Record<string, Question[]> = {
  mat_1: [
    {
      id: 'q_1',
      materialSetId: 'mat_1',
      canonicalKey: 'mock-1',
      displayLabel: '1',
      subject: 'math',
      createdAt: '2025-12-01T00:00:00.000Z',
      updatedAt: '2025-12-01T00:00:00.000Z',
    },
  ],
};

let kanjiItems: Kanji[] = [
  {
    id: 'k_1',
    kanji: '試',
    reading: 'し',
    meaning: 'ためす',
    subject: 'japanese',
    createdAt: '2025-12-01T00:00:00.000Z',
    updatedAt: '2025-12-01T00:00:00.000Z',
  },
];

let attempts: Attempt[] = [];

let reviewTests: ReviewTestDetail[] = [];

const dashboardData: DashboardData = {
  todayTestCount: 0,
  inventoryCount: 0,
  lockedCount: 0,
  topIncorrectQuestions: [],
  topIncorrectKanji: [],
};

async function readJsonSafely(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function readCreateWordTestBody(request: Request): Promise<Partial<CreateWordTestRequest>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const subject = formData.get('subject');
    const count = formData.get('count');
    const name = formData.get('name');
    const sourceId = formData.get('sourceId') ?? formData.get('source_id');
    const gradedAnswerSheet = formData.get('gradedAnswerSheet') ?? formData.get('graded_answer_sheet');
    const questionPaper = formData.get('questionPaper') ?? formData.get('question_paper');
    const answerKey = formData.get('answerKey') ?? formData.get('answer_key');

    return {
      subject: typeof subject === 'string' ? (subject as any) : undefined,
      count: typeof count === 'string' ? Number(count) : undefined,
      name: typeof name === 'string' ? name : undefined,
      sourceId: typeof sourceId === 'string' ? sourceId : undefined,
      gradedAnswerSheet: (gradedAnswerSheet as File | null) ?? undefined,
      questionPaper: (questionPaper as File | null) ?? undefined,
      answerKey: (answerKey as File | null) ?? undefined,
    };
  }

  const body = (await readJsonSafely(request)) as Partial<CreateWordTestRequest> | null;
  return body ?? {};
}

export const handlers = [
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  http.post('/api/upload-url', async ({ request }) => {
    const body = (await request.json()) as Partial<GetUploadUrlRequest>;

    if (!body.fileName || !body.contentType) {
      return new HttpResponse(null, { status: 400 });
    }

    const fileKey = `uploads/${newId()}-${body.fileName}`;
    const uploadUrl = `http://localhost/mock-s3/${encodeURIComponent(fileKey)}`;

    const response: GetUploadUrlResponse = {
      uploadUrl,
      fileKey,
    };
    return HttpResponse.json(response);
  }),

  http.put('http://localhost/mock-s3/:key*', ({ params }) => {
    const key = String(params.key);
    uploadedObjects.add(key);
    return new HttpResponse(null, { status: 200 });
  }),

  http.post('/api/analyze-paper', async ({ request }) => {
    const body = (await request.json()) as AnalyzePaperRequest;
    void body;
    const response: AnalyzePaperResponse = {
      questions: ['1', '1-1', '1-2', '2', '2-1'],
    };
    return HttpResponse.json(response);
  }),

  http.get('/api/dashboard', () => {
    return HttpResponse.json(dashboardData);
  }),

  http.get('/api/exampapers', () => {
    return HttpResponse.json({ datas: examPapers });
  }),

  http.post('/api/exampapers', async ({ request }) => {
    const body = (await request.json()) as CreateExamPaperRequest;
    const item: ExamPaper = {
      paperId: `paper_${newId()}`,
      createdAt: nowIso(),
      ...body,
    };
    examPapers = [item, ...examPapers];
    return HttpResponse.json(item);
  }),

  http.get('/api/examresults', () => {
    return HttpResponse.json({ datas: examResults });
  }),

  http.post('/api/examresults', async ({ request }) => {
    const body = (await request.json()) as CreateExamResultRequest;
    const item: ExamResult = {
      resultId: `result_${newId()}`,
      createdAt: nowIso(),
      ...body,
    };
    examResults = [item, ...examResults];
    return HttpResponse.json(item);
  }),

  http.get('/api/material-sets', () => {
    const response: MaterialSetListResponse = {
      items: materialSets,
      total: materialSets.length,
    };
    return HttpResponse.json(response);
  }),

  http.post('/api/material-sets', async ({ request }) => {
    const body = (await request.json()) as CreateMaterialSetRequest;
    const item: MaterialSet = {
      id: `mat_${newId()}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...body,
    };
    materialSets = [item, ...materialSets];
    return HttpResponse.json(item);
  }),

  http.get('/api/material-sets/:materialSetId', ({ params }) => {
    const materialSetId = String(params.materialSetId);
    const found = materialSets.find((x) => x.id === materialSetId);
    if (!found) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(found);
  }),

  http.get('/api/material-sets/:materialSetId/files', () => {
    return HttpResponse.json([]);
  }),

  http.get('/api/material-sets/:materialSetId/questions', ({ params }) => {
    const materialSetId = String(params.materialSetId);
    const items = questionsByMaterialSetId[materialSetId] ?? [];
    const response: QuestionListResponse = { datas: items };
    return HttpResponse.json(response);
  }),

  http.post('/api/material-sets/:materialSetId/questions', async ({ params, request }) => {
    const materialSetId = String(params.materialSetId);
    const body = (await request.json()) as CreateQuestionRequest;

    const item: Question = {
      id: `q_${newId()}`,
      materialSetId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...body,
    };
    questionsByMaterialSetId[materialSetId] = [item, ...(questionsByMaterialSetId[materialSetId] ?? [])];
    const response: CreateQuestionResponse = item;
    return HttpResponse.json(response);
  }),

  http.patch('/api/questions/:questionId', async ({ params, request }) => {
    const questionId = String(params.questionId);
    const body = (await request.json()) as UpdateQuestionRequest;

    let updated: Question | null = null;

    Object.keys(questionsByMaterialSetId).forEach((materialSetId) => {
      const items = questionsByMaterialSetId[materialSetId] ?? [];
      questionsByMaterialSetId[materialSetId] = items.map((q) => {
        if (q.id !== questionId) return q;
        updated = {
          ...q,
          ...body,
          updatedAt: nowIso(),
        };
        return updated;
      });
    });

    if (!updated) return new HttpResponse(null, { status: 404 });
    const response: UpdateQuestionResponse = updated;
    return HttpResponse.json(response);
  }),

  http.get('/api/kanji', () => {
    const response = {
      items: kanjiItems,
      total: kanjiItems.length,
    };
    return HttpResponse.json(response);
  }),

  http.post('/api/kanji', async ({ request }) => {
    const body = (await request.json()) as CreateKanjiRequest;
    const item: Kanji = {
      id: `k_${newId()}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...body,
    };
    kanjiItems = [item, ...kanjiItems];
    const response: CreateKanjiResponse = item;
    return HttpResponse.json(response);
  }),

  http.post('/api/tests/:testId/attempts', async ({ params, request }) => {
    const testId = String(params.testId);
    const body = (await request.json()) as CreateAttemptRequest;
    const attempt: Attempt = {
      attemptId: `att_${newId()}`,
      testId,
      subjectId: body.subjectId,
      status: 'IN_PROGRESS',
      startedAt: nowIso(),
      results: [],
    };
    attempts = [attempt, ...attempts];
    const response: CreateAttemptResponse = attempt;
    return HttpResponse.json(response, { status: 201 });
  }),

  http.patch('/api/attempts/:attemptId/submit', async ({ params, request }) => {
    const attemptId = String(params.attemptId);
    const body = (await request.json()) as SubmitAttemptRequest;
    const idx = attempts.findIndex((x) => x.attemptId === attemptId);
    if (idx < 0) return new HttpResponse(null, { status: 404 });
    const updated: Attempt = {
      ...attempts[idx],
      status: 'SUBMITTED',
      submittedAt: nowIso(),
      results: body.results,
    };
    attempts = attempts.map((x) => (x.attemptId === attemptId ? updated : x));
    const response: SubmitAttemptResponse = updated;
    return HttpResponse.json(response);
  }),

  http.get('/api/tests/:testId/attempts/latest', ({ params }) => {
    const testId = String(params.testId);
    const latest = attempts.find((x) => x.testId === testId) ?? null;
    if (!latest) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(latest);
  }),

  http.get('/api/review-tests', () => {
    const items = reviewTests.map((x) => ({
      id: x.id,
      testId: x.testId,
      subject: x.subject,
      status: x.status,
      itemCount: x.itemCount,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
      score: x.score,
    }));
    const response: ReviewTestListResponse = { items, total: items.length };
    return HttpResponse.json(response);
  }),

  http.post('/api/review-tests', async ({ request }) => {
    const body = (await request.json()) as CreateReviewTestRequest;
    const id = `rt_${newId()}`;
    const createdAt = nowIso();
    const detail: ReviewTestDetail = {
      id,
      testId: id,
      subject: body.subject,
      status: 'IN_PROGRESS',
      itemCount: body.count,
      createdAt,
      updatedAt: createdAt,
      items: Array.from({ length: body.count }).map((_, i) => ({
        id: `${id}_item_${i + 1}`,
        testId: id,
        targetType: body.mode,
        targetId: `${body.mode.toLowerCase()}_${i + 1}`,
        displayLabel: String(i + 1),
        isCorrect: undefined,
      })),
    };
    reviewTests = [detail, ...reviewTests];
    const response: CreateReviewTestResponse = {
      id: detail.id,
      testId: detail.testId,
      subject: detail.subject,
      status: detail.status,
      itemCount: detail.itemCount,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      score: detail.score,
    };
    return HttpResponse.json(response, { status: 201 });
  }),

  http.get('/api/review-tests/:testId', ({ params }) => {
    const testId = String(params.testId);
    const found = reviewTests.find((x) => x.id === testId || x.testId === testId) ?? null;
    if (!found) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(found);
  }),

  http.patch('/api/review-tests/:testId', async ({ params, request }) => {
    const testId = String(params.testId);
    const body = (await request.json()) as UpdateReviewTestStatusRequest;
    const found = reviewTests.find((x) => x.id === testId || x.testId === testId) ?? null;
    if (!found) return new HttpResponse(null, { status: 404 });
    reviewTests = reviewTests.map((x) =>
      x.id === found.id
        ? {
            ...x,
            status: body.status,
            updatedAt: nowIso(),
          }
        : x
    );
    const updated = reviewTests.find((x) => x.id === found.id) as ReviewTestDetail;
    const response: ReviewTest = {
      id: updated.id,
      testId: updated.testId,
      subject: updated.subject,
      status: updated.status,
      itemCount: updated.itemCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      score: updated.score,
    };
    return HttpResponse.json(response);
  }),

  http.delete('/api/review-tests/:testId', ({ params }) => {
    const testId = String(params.testId);
    reviewTests = reviewTests.filter((x) => x.id !== testId && x.testId !== testId);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/review-tests/:testId/results', async ({ params, request }) => {
    const testId = String(params.testId);
    const body = (await request.json()) as SubmitReviewTestResultsRequest;
    const found = reviewTests.find((x) => x.id === testId || x.testId === testId) ?? null;
    if (!found) return new HttpResponse(null, { status: 404 });

    const correctByTargetId = new Map(body.results.map((r) => [r.targetId, r.isCorrect]));

    reviewTests = reviewTests.map((x) => {
      if (x.id !== found.id) return x;
      const nextItems = x.items.map((item) => ({
        ...item,
        isCorrect: correctByTargetId.get(item.targetId) ?? item.isCorrect,
      }));
      return {
        ...x,
        items: nextItems,
        updatedAt: nowIso(),
      };
    });

    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/review-tests/:testId/pdf', ({ params }) => {
    const testId = String(params.testId);
    return HttpResponse.json({ url: `http://localhost/mock-pdf/${encodeURIComponent(testId)}.pdf` });
  }),

  http.get('/api/wordtests', () => {
    return HttpResponse.json({
      datas: wordTests.map(toSummary),
    });
  }),

  http.post('/api/wordtests', async ({ request }) => {
    const body = await readCreateWordTestBody(request);

    if (!body.subject) {
      return new HttpResponse(null, { status: 400 });
    }

    if (typeof body.count !== 'number' || !Number.isFinite(body.count) || body.count < 1) {
      return new HttpResponse(null, { status: 400 });
    }

    const nextIndex = wordTests.filter((x) => x.subject === body.subject).length + 1;

    const newItem: WordTestWithItems = {
      id: newId(),
      subject: body.subject,
      name: body.name || `${SUBJECT_LABEL[body.subject]} 単語テスト ${nextIndex}`,
      createdAt: new Date().toISOString(),
      isGraded: false,
      items: build_items(body.subject, body.count),
    };

    wordTests = [newItem, ...wordTests];

    const response: CreateWordTestResponse = toSummary(newItem);
    return HttpResponse.json(response);
  }),

  http.get('/api/wordtests/:wordTestId', ({ params }) => {
    const wordTestId = String(params.wordTestId);
    const found = wordTests.find((x) => x.id === wordTestId) ?? null;

    if (!found) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      id: found.id,
      items: found.items,
    });
  }),

  http.post('/api/wordtests/:wordTestId/grading', async ({ params, request }) => {
    const wordTestId = String(params.wordTestId);
    const found = wordTests.find((x) => x.id === wordTestId) ?? null;

    if (!found) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = (await request.json()) as {
      results?: Array<{ qid?: string; grading?: GradingValue }>;
    };

    if (!Array.isArray(body.results)) {
      return new HttpResponse(null, { status: 400 });
    }

    const gradingByQid = new Map<string, GradingValue>();
    for (const x of body.results) {
      if (!x?.qid || x.grading === undefined) {
        return new HttpResponse(null, { status: 400 });
      }
      gradingByQid.set(x.qid, x.grading);
    }

    const nextGrading = found.items.map((item) => gradingByQid.get(item.qid));
    if (nextGrading.some((x) => x === undefined)) {
      return new HttpResponse(null, { status: 400 });
    }

    wordTests = wordTests.map((x) => {
      if (x.id !== wordTestId) return x;

      const nextItems = x.items.map((item, index) => ({
        ...item,
        grading: nextGrading[index],
      }));

      return {
        ...x,
        isGraded: true,
        items: nextItems,
      };
    });

    return new HttpResponse(null, { status: 204 });
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
    ]);
  }),
];
