# Backend API 一覧

本書は [要件定義書\_v1.2.md](../要件定義_v1.2.md) をベースに、Smart Exam の Backend API の「一覧」を記載します。

実装上の正は Backend のルーティング定義（`backend/src/app/createApp.ts`）とし、本書は「エンドポイントの棚卸し」に留めます。

- フロントエンド画面設計: [docs/frontend.md](frontend.md)
- Request / Response の詳細定義は [docs/swagger.yml](swagger.yml) に記載します。
- DynamoDB のテーブル定義は [docs/dynamodb_tables.md](dynamodb_tables.md) に記載します。

---

## 共通

- GET /health
  - ヘルスチェック
- GET /v1/health
  - ヘルスチェック（互換パス）

---

## S3（アップロード）

- POST /api/upload-url
  - S3 へアップロードするための署名付きURLを発行

---

## Bedrock（解析）

- POST /api/analyze-paper
  - 試験用紙を解析して構造化データを生成

---

## Dashboard

- GET /api/dashboard
  - ダッシュボード表示用の集計情報を取得

---

## Materials（教材）

- GET /api/materials
  - 教材一覧を取得
- POST /api/materials/search
  - 条件を指定して教材を検索
- POST /api/materials
  - 教材を新規作成
- GET /api/materials/{materialId}
  - 指定した教材の詳細を取得
- PATCH /api/materials/{materialId}
  - 指定した教材の情報を更新
- DELETE /api/materials/{materialId}
  - 指定した教材を削除
- GET /api/materials/{materialId}/files
  - 指定した教材に紐づくファイル一覧を取得
- GET /api/materials/{materialId}/files/{fileId}
  - 指定した教材ファイルの詳細を取得

---

## Kanji（漢字）

- GET /api/kanji
  - 漢字データの一覧を取得
- POST /api/kanji/search
  - 条件を指定して漢字データを検索
- POST /api/kanji
  - 漢字データを新規作成
- GET /api/kanji/{kanjiId}
  - 指定した漢字データの詳細を取得
- PATCH /api/kanji/{kanjiId}
  - 指定した漢字データを更新
- DELETE /api/kanji/{kanjiId}
  - 指定した漢字データを削除
- POST /api/kanji/deletions
  - 複数の漢字データを一括削除
- POST /api/kanji/import
  - 漢字データを一括インポート

---

## Questions（問題）

- POST /api/questions/search
  - 条件を指定して問題を検索
- GET /api/materials/{materialId}/questions
  - 指定した教材に紐づく問題一覧を取得
- POST /api/materials/{materialId}/questions
  - 指定した教材に新しい問題を追加
- PATCH /api/questions/{questionId}
  - 指定した問題を更新
- PUT /api/questions/{questionId}/review-candidate
  - 指定した問題の復習候補を作成または更新
- DELETE /api/questions/{questionId}/review-candidate
  - 指定した問題の復習候補を削除
- DELETE /api/questions/{questionId}
  - 指定した問題を削除

---

## Tests（復習テスト）

### Kanji Tests

- GET /api/exam/kanji
  - 漢字テスト一覧を取得
- POST /api/exam/kanji/search
  - 条件を指定して漢字テストを検索
- POST /api/exam/kanji
  - 漢字テストを新規作成
- GET /api/exam/kanji/targets
  - 漢字テスト作成対象の候補一覧を取得

- GET /api/exam/kanji/{testId}
  - 指定した漢字テストの詳細を取得
- GET /api/exam/kanji/{testId}/pdf
  - 指定した漢字テストのPDF情報を取得
- PATCH /api/exam/kanji/{testId}
  - 指定した漢字テストのステータスを更新
- DELETE /api/exam/kanji/{testId}
  - 指定した漢字テストを削除
- POST /api/exam/kanji/{testId}/results
  - 指定した漢字テストの結果を登録

### Question Tests

- GET /api/exam/question
  - 問題テスト一覧を取得
- POST /api/exam/question/search
  - 条件を指定して問題テストを検索
- POST /api/exam/question
  - 問題テストを新規作成
- GET /api/exam/question/targets
  - 問題テスト作成対象の候補一覧を取得

- GET /api/exam/question/{testId}
  - 指定した問題テストの詳細を取得
- GET /api/exam/question/{testId}/pdf
  - 指定した問題テストのPDF情報を取得
- PATCH /api/exam/question/{testId}
  - 指定した問題テストのステータスを更新
- DELETE /api/exam/question/{testId}
  - 指定した問題テストを削除
- POST /api/exam/question/{testId}/results
  - 指定した問題テストの結果を登録

### Related

- GET /api/review-test-candidates
  - 復習テスト候補の一覧を取得
- GET /api/review-attempts
  - 復習テストの実施履歴を参照（読み取り専用）
