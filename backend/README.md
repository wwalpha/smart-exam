# smart-exam backend

## セットアップ
- Node.js を用意
- `npm install`

## コマンド
- `npm run build`
- `npm run test`
- `npm run test:integration` (Docker が必要 / DynamoDB Local を起動して `src/services` の統合テストも実行)
- `npm run typecheck`

## 構成
- `src/handlers`: Lambda ハンドラ
- `src/services`: ビジネスロジック
- `src/repositories`: データアクセス (DynamoDB)
- `src/types`: 共通型
