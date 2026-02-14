import { z } from 'zod';

import { BooleanFromUnknownSchema } from '@/lib/zodSchemas';

// クエリ値が配列で来た場合は先頭要素のみを評価対象にする
const queryValue = (schema: z.ZodTypeAny) => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema);

/** GetExamPdfParamsSchema validates path params. */
export const GetExamPdfParamsSchema = z.object({
  // PDF取得対象のテストID
  testId: z.string().min(1),
});

/** GetExamPdfQuerySchema validates query string. */
export const GetExamPdfQuerySchema = z.object({
  // true の場合は署名URLではなくPDFバイナリを直接返す
  direct: queryValue(BooleanFromUnknownSchema).optional(),
  // true の場合は添付ファイルとしてダウンロードさせる
  download: queryValue(BooleanFromUnknownSchema).optional(),
  // true の場合は生成済み問題をPDFに含める
  includeGenerated: queryValue(BooleanFromUnknownSchema).optional(),
});
