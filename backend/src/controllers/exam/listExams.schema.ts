import { z } from 'zod';

/** ListExamsQuerySchema validates query string. */
// 一覧取得APIは現時点でクエリ条件なし
export const ListExamsQuerySchema = z.object({});
