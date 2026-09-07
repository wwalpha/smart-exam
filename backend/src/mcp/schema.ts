import { z } from 'zod';
import { DateUtils } from '@/lib/dateUtils';

export const id = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[^\p{Cc}]+$/u);
const subject = z.enum(['1', '2', '3', '4']);
const mode = z.enum(['MATERIAL', 'KANJI']);
const page = {
  pageSize: z.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(12000).optional(),
};
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(DateUtils.isValidYmd);
const range = (fields: [string, ...string[]]) =>
  z
    .strictObject({ field: z.enum(fields), from: date, to: date, includeUndated: z.boolean().default(false) })
    .refine((value) => value.from <= value.to);
export const inputs = {
  get_learning_context: z.strictObject({}),
  search_materials: z.strictObject({
    subject: subject.optional(),
    provider: id.optional(),
    grade: id.optional(),
    isCompleted: z.boolean().optional(),
    dateRange: range(['materialDate', 'registeredDate']).optional(),
    ...page,
  }),
  get_material: z.strictObject({
    materialId: id,
    view: z.enum(['SUMMARY', 'QUESTIONS', 'FILES']).default('SUMMARY'),
    ...page,
  }),
  search_exams: z.strictObject({
    mode: mode.optional(),
    subject: subject.optional(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
    dateRange: range(['createdDate', 'submittedDate']).optional(),
    ...page,
  }),
  get_exam: z.strictObject({
    examId: id,
    view: z.enum(['SUMMARY', 'ITEMS', 'FILES']).default('SUMMARY'),
    ...page,
  }),
  get_target_learning_history: z.strictObject({
    mode,
    targetId: id,
    view: z.enum(['RESULTS', 'REVIEW_STATE', 'LIFECYCLE']).default('RESULTS'),
    ...page,
  }),
  get_file_access: z.strictObject({ fileRef: z.string().min(1).max(12000) }),
};
export const sourceRef = z.strictObject({
  entityType: z.string(),
  entityId: id,
  seq: z.number().int().nullable().optional(),
  field: z.string().optional(),
});
export const quality = z.strictObject({
  consistency: z.literal('LIVE'),
  pointInTimeSnapshot: z.literal(false),
  warnings: z.array(z.string()),
  missingSources: z.array(sourceRef),
});
const nullableString = z.string().nullable();
export const observation = z.strictObject({
  evidenceId: z.string(),
  evidenceHash: z.string().regex(/^[a-f0-9]{64}$/),
  sourceType: z.enum(['INITIAL_MATERIAL', 'REVIEW_EXAM', 'KANJI_EXAM']),
  target: z.strictObject({ mode, targetId: id }),
  materialId: nullableString,
  examId: nullableString,
  seq: z.number().int().nullable(),
  subject: subject.nullable(),
  canonicalKey: nullableString,
  occurredOn: nullableString,
  rawOccurredOn: nullableString,
  dateSource: z.enum(['MATERIAL_REGISTERED_DATE', 'EXAM_SUBMITTED_DATE', 'UNKNOWN']),
  datePrecision: z.enum(['DAY', 'UNKNOWN']),
  materialDate: nullableString,
  createdDate: nullableString,
  finalizationStatus: z.enum(['FINAL', 'PROVISIONAL']),
  result: z.enum(['CORRECT', 'INCORRECT', 'UNGRADED', 'CONFLICT']),
  isCorrect: z.boolean().nullable(),
  rawResults: z.strictObject({
    choice: nullableString,
    examResults: z.array(z.boolean()),
    detailResult: z.boolean().nullable(),
  }),
  questionText: nullableString,
  correctAnswer: nullableString,
  studentAnswer: z.null(),
  readingHiragana: nullableString,
  underlineSpec: z
    .strictObject({ type: z.literal('promptSpan'), start: z.number(), length: z.number() })
    .nullable(),
  contentBasis: z.enum(['CURRENT_MASTER', 'SOURCE_FILE', 'UNAVAILABLE']),
  fileRefs: z.array(z.string()),
  sourceRefs: z.array(sourceRef),
  quality,
});
export const materialSummary = z.strictObject({
  materialId: id,
  title: nullableString,
  subject: subject.nullable(),
  provider: nullableString,
  grade: nullableString,
  materialDate: nullableString,
  registeredDate: nullableString,
  isCompleted: z.boolean().nullable(),
  questionCount: z.number().nullable(),
  metadataHash: z.string(),
});
export const examSummary = z.strictObject({
  examId: id,
  mode: mode.nullable(),
  subject: subject.nullable(),
  status: nullableString,
  createdDate: nullableString,
  submittedDate: nullableString,
  count: z.number().nullable(),
  metadataHash: z.string(),
});
export const file = z.strictObject({
  fileRef: z.string(),
  ownerRef: sourceRef,
  role: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().nullable(),
  lastModified: nullableString,
  etag: nullableString,
  versionId: nullableString,
  selected: z.boolean().nullable(),
});
export const diagnostic = z.strictObject({
  kind: z.literal('SOURCE_ONLY'),
  examId: id,
  seq: z.null(),
  rawResult: z.strictObject({ id, isCorrect: z.boolean() }),
  sourceRefs: z.array(sourceRef),
  quality,
  evidenceId: z.string(),
  evidenceHash: z.string(),
});
export const lifecycle = z.strictObject({
  kind: z.literal('QUEUE_LIFECYCLE'),
  record: z.strictObject({
    id,
    subject: subject.nullable(),
    questionId: id,
    mode,
    status: z.string(),
    correctCount: z.number().nullable(),
    nextTime: nullableString,
    closedAt: nullableString,
  }),
  correctCountMeaning: z.literal('RAW_QUEUE_VALUE_NOT_EXAM_RESULT'),
  sourceRefs: z.array(sourceRef),
});
const collection = (item: z.ZodType) =>
  z.strictObject({
    items: z.array(item),
    order: z.literal('UNSPECIFIED'),
    total: z.null(),
    availability: z.enum(['AVAILABLE', 'NOT_GENERATED']).optional(),
  });
const state = z.strictObject({
  target: z.strictObject({ mode, targetId: id }),
  state: z.enum(['OPEN', 'LOCKED', 'EXCLUDED', 'NO_ACTIVE_CANDIDATE', 'INCONSISTENT']),
  correctCount: z.number().nullable(),
  nextTime: nullableString,
  lockedByExamId: nullableString,
  sourceRefs: z.array(sourceRef),
  masteryAssessment: z.literal('NOT_PROVIDED'),
});
const context = z.strictObject({
  environment: z.string(),
  businessTimezone: z.literal('Asia/Tokyo'),
  subjects: z.record(subject, z.string()),
  contractVersion: z.literal('1.0.0'),
  serverVersion: z.string(),
  protocols: z.array(z.string()),
  capabilities: z.strictObject({
    existingMaterialFiles: z.literal(true),
    storedExamFiles: z.literal(true),
    targetHistory: z.literal(true),
    supplementalReports: z.literal(false),
    changeTracking: z.literal(false),
  }),
  limitations: z.array(z.string()),
});
export const dataSchemas = {
  get_learning_context: context,
  search_materials: collection(materialSummary),
  get_material: z.union([materialSummary, collection(observation), collection(file)]),
  search_exams: collection(examSummary),
  get_exam: z.union([examSummary, collection(z.union([observation, diagnostic])), collection(file)]),
  get_target_learning_history: z.union([collection(observation), collection(lifecycle), state]),
  get_file_access: file.extend({
    url: z.string().url(),
    expiresAt: z.string(),
    downloadMethod: z.literal('GET'),
  }),
};
export const responseSchema = (name: keyof typeof inputs) =>
  z.strictObject({
    contractVersion: z.literal('1.0.0'),
    environment: z.string(),
    serverVersion: z.string(),
    requestId: z.string(),
    observedAt: z.string(),
    data: dataSchemas[name],
    pagination: z.strictObject({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
    quality,
  });

export const businessError = z.strictObject({
  code: z.enum([
    'NOT_FOUND',
    'INVALID_CURSOR',
    'FILE_NOT_GENERATED',
    'FILE_CHANGED',
    'FEATURE_UNAVAILABLE',
    'UPSTREAM_UNAVAILABLE',
    'RESPONSE_TOO_LARGE',
  ]),
  message: z.string(),
  retryable: z.boolean(),
  requestId: z.string(),
});
