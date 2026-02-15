# Frontend未呼び出しAPI一覧（backend定義との差分）

## 判定基準

- backend の公開APIは `backend/src/app/createApp.ts` の `app.get/post/put/patch/delete` から抽出。
- frontend の呼び出しは `frontend/src/**` 内の `apiRequest` / `apiRequestBlob` の `method + path` を対象に抽出。
- 以下は「同一 method + path が frontend 側に存在しない」API（静的解析ベース）。

## 未呼び出しAPI

- `GET /health`
- `GET /v1/health`
- `GET /api/materials`

## 補足

- 材料一覧は frontend で `POST /api/materials/search` を使用しているため、`GET /api/materials` は未使用。
