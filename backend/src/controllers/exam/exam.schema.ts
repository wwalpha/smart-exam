import { EXAM_MODE } from '@smart-exam/api-types';
import { z } from 'zod';

import { DateUtils } from '@/lib/dateUtils';
import { BooleanFromUnknownSchema, PositiveIntFromUnknownSchema, SubjectIdSchema } from '@/lib/zodSchemas';

const ExamModeSchema = z.enum([EXAM_MODE.MATERIAL, EXAM_MODE.KANJI]);
const queryValue = (schema: z.ZodTypeAny) => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema);
const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const ListExamsQuerySchema = z.object({});

export const CreateExamBodySchema = z
  .object({
    subject: SubjectIdSchema,
    count: PositiveIntFromUnknownSchema,
    mode: ExamModeSchema,
    materialIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((value, context) => {
    if (value.mode === EXAM_MODE.MATERIAL && (!value.materialIds || value.materialIds.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['materialIds'],
        message: '教材を1件以上選択してください',
      });
    }
  });

export const DeleteExamParamsSchema = z.object({
  examId: z.string().min(1),
});

export const CompleteExamParamsSchema = z.object({
  examId: z.string().min(1),
});

export const GetExamParamsSchema = z.object({
  examId: z.string().min(1),
});

export const GetExamPdfParamsSchema = z.object({
  examId: z.string().min(1),
});

export const GetExamPdfQuerySchema = z.object({
  direct: queryValue(BooleanFromUnknownSchema).optional(),
  download: queryValue(BooleanFromUnknownSchema).optional(),
  includeGenerated: queryValue(BooleanFromUnknownSchema).optional(),
});

export const ListExamTargetsQuerySchema = z.object({
  mode: queryString().pipe(ExamModeSchema),
  from: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  to: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});

export const SearchExamsBodySchema = z.object({
  subject: z.union([z.literal('ALL'), SubjectIdSchema]),
  mode: ExamModeSchema,
  status: z.union([z.literal('ALL'), z.literal('IN_PROGRESS'), z.literal('COMPLETED')]).optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export const SubmitExamResultsParamsSchema = z.object({
  examId: z.string().min(1),
});

export const SubmitExamResultsBodySchema = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      isCorrect: z.boolean(),
    }),
  ),
  date: z.string().optional(),
});

export const UpdateExamStatusParamsSchema = z.object({
  examId: z.string().min(1),
});

export const UpdateExamStatusBodySchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
});

export const CreateTestBodySchema = z.object({
  subject: SubjectIdSchema,
  count: PositiveIntFromUnknownSchema,
});

export const SearchTestsBodySchema = z.object({
  subject: z.union([z.literal('ALL'), SubjectIdSchema]),
  status: z.union([z.literal('ALL'), z.literal('IN_PROGRESS'), z.literal('COMPLETED')]).optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export const ListTestTargetsQuerySchema = z.object({
  from: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  to: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});
