import { z } from 'zod';

import { EXAM_MODE } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';

// 復習モードは問題単位か漢字単位のいずれかを許可する
const ReviewModeSchema = z.enum([EXAM_MODE.MATERIAL, EXAM_MODE.KANJI]);

// クエリ値が配列で来た場合は先頭要素のみを文字列として扱う
const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
// 任意クエリ用の文字列ヘルパー
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

/** ListExamTargetsQuerySchema validates query string. */
export const ListExamTargetsQuerySchema = z.object({
  // 抽出対象の復習モード
  mode: queryString().pipe(ReviewModeSchema),
  // 抽出開始日（YYYY-MM-DD）
  from: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  // 抽出終了日（YYYY-MM-DD）
  to: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  // 絞り込み対象の科目ID（省略可）
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});
