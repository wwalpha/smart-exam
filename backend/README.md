# smart-exam backend

## セットアップ

- Node.js を用意
- リポジトリ root で `yarn install`

## コマンド

- `yarn workspace smart-exam-backend build`
- `yarn workspace smart-exam-backend test`
- `yarn workspace smart-exam-backend test:integration` (Docker が必要 / DynamoDB Local を起動して `src/services` の統合テストも実行)
- `yarn workspace smart-exam-backend typecheck`
- `yarn workspace smart-exam-backend migrate:material-review-v2 --dry-run --report /tmp/material-review-v2.json`
  - [MATERIAL復習5回ルール・移行と復旧手順](../docs/material-review-v2.md) を参照。

## ローカル起動（開発）

- `yarn workspace smart-exam-backend dev`
  - デフォルト: `http://0.0.0.0:3001`（`PORT` / `HOST` で変更可）

## 構成

- `src/handlers`: Lambda ハンドラ
- `src/services`: ビジネスロジック
- `src/repositories`: データアクセス (DynamoDB)
- `src/types`: 共通型
