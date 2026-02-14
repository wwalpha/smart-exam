# smart-exam backend

## セットアップ

- Node.js を用意
- リポジトリ root で `yarn install`

## コマンド

- `yarn workspace smart-exam-backend build`
- `yarn workspace smart-exam-backend test`
- `yarn workspace smart-exam-backend test:integration` (Docker が必要 / DynamoDB Local を起動して `src/services` の統合テストも実行)
- `yarn workspace smart-exam-backend typecheck`

## ローカル起動（開発）

- `yarn workspace smart-exam-backend dev`
  - デフォルト: `http://0.0.0.0:3001`（`PORT` / `HOST` で変更可）

## 構成

- `src/handlers`: Lambda ハンドラ
- `src/services`: ビジネスロジック
- `src/repositories`: データアクセス (DynamoDB)
- `src/types`: 共通型
