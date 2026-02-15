import { z } from 'zod';

import { EXAM_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

// 復習モードは問題単位か漢字単位のいずれかを許可する
const ReviewModeSchema = z.enum([EXAM_MODE.QUESTION, EXAM_MODE.KANJI]);

/** SearchExamsBodySchema validates input shape. */
export const SearchExamsBodySchema = z.object({
  // 科目条件（ALL指定可）
  subject: z.union([z.literal('ALL'), SubjectIdSchema]),
  // 復習モード条件
  mode: ReviewModeSchema,
  // ステータス条件（省略時は全件）
  status: z.union([z.literal('ALL'), z.literal('IN_PROGRESS'), z.literal('COMPLETED')]).optional(),
  // 取得上限件数
  limit: z.number().int().positive().optional(),
  // ページネーション継続用カーソル
  cursor: z.string().optional(),
});
