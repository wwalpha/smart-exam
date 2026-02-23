import { z } from 'zod';

import { EXAM_MODE } from '@smart-exam/api-types';

import { PositiveIntFromUnknownSchema, SubjectIdSchema } from '@/lib/zodSchemas';

// 復習モードは問題単位か漢字単位のいずれかを許可する
const ExamModeSchema = z.enum([EXAM_MODE.MATERIAL, EXAM_MODE.KANJI]);

/** CreateExamBodySchema validates input shape. */
export const CreateExamBodySchema = z.object({
  // 対象科目ID
  subject: SubjectIdSchema,
  // 出題件数
  count: PositiveIntFromUnknownSchema,
  // 復習モード
  mode: ExamModeSchema,
  // 出題対象に含める教材ID（指定順）
  materialIds: z.array(z.string().min(1)).optional(),
});
