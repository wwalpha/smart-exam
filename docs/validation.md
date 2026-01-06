# Zod リクエスト検証（middleware 1行）

backend（Express + TypeScript）では、Zod を使って **ルート定義に1行追加**するだけで request の実行時検証を行えます。

- 検証は `safeParse` を使用
- 失敗時は middleware が **400** を返し、handler は実行されません
- 成功時は `req.validated` に格納されます（デフォルト）
- オプションで `req.body` を置換することもできます

## 使い方（Body）

例: `POST /api/materials`

```ts
import { validateBody } from '@/middlewares/validateZod';
import { CreateMaterialBodySchema } from '@/handlers/materials/createMaterial';

app.post(
  '/api/materials',
  validateBody(CreateMaterialBodySchema),
  handleRequest(materialHandler.createMaterial)
);
```

handler 側では `req.validated.body` を型付きで参照できます。

```ts
import type { ValidatedBody } from '@/types/express';

const body = req.validated!.body as ValidatedBody<typeof CreateMaterialBodySchema>;
```

## 使い方（Query / Params）

```ts
import { z } from 'zod';
import { validateQuery, validateParams } from '@/middlewares/validateZod';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

const ParamsSchema = z.object({
  materialId: z.string().min(1),
});

app.get(
  '/api/materials/:materialId',
  validateParams(ParamsSchema),
  validateQuery(QuerySchema),
  handleRequest(materialHandler.getMaterial)
);
```

`req.query` は `string | string[] | undefined` になりがちなので、`z.coerce.*` を使うのが安全です。

## assignToBody オプション

デフォルトは安全のため `req.validated.body` にだけ格納します。

`assignToBody: true` を渡すと、成功時に `req.body = parsed.data` へ置換します。

```ts
validateBody(Schema, { assignToBody: true })
```

## バリデーション失敗時のレスポンス

例:

```json
{
  "message": "Invalid request body",
  "issues": [
    { "path": ["item"], "message": "Required", "code": "invalid_type" }
  ]
}
```
