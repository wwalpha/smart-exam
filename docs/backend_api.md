# Backend API 一覧

本書は [要件定義書_v1.2.md](../要件定義_v1.2.md) をベースに、Smart Exam の Backend API の「一覧」を記載します。

- フロントエンド画面設計: [docs/frontend.md](frontend.md)
- Request / Response の詳細定義は [docs/swagger.yml](swagger.yml) に記載します。
- DynamoDB のテーブル定義は [docs/dynamodb_tables.md](dynamodb_tables.md) に記載します。

---

## 共通

- GET /api/health
  - ヘルスチェック
- GET /api/me
  - ログイン中ユーザー情報

---

## Material Sets（教材セット）

- GET /api/material-sets
  - 一覧取得（検索/フィルタ/ページング）
  - Query: subject, grade, provider, from, to, q, limit, cursor
- POST /api/material-sets
  - 新規作成
- GET /api/material-sets/{materialSetId}
  - 詳細取得
- PATCH /api/material-sets/{materialSetId}
  - メタ情報更新

---

## Material Files（教材ファイル: PDF/画像）

- POST /api/material-sets/{materialSetId}/files
  - アップロード（推奨: multipart）
- GET /api/material-sets/{materialSetId}/files
  - ファイル一覧
- GET /api/files/{fileId}/download
  - ダウンロード（署名URL or stream）
- PATCH /api/files/{fileId}
  - ステータス更新（例: ARCHIVED）

---

## Questions（問題）

- POST /api/material-sets/{materialSetId}/questions/candidates
  - OCR/抽出候補の登録（候補扱い）
- POST /api/material-sets/{materialSetId}/questions
  - 問題の確定登録（手動確定）
- GET /api/material-sets/{materialSetId}/questions
  - 教材セット内の問題一覧
- PATCH /api/questions/{questionId}
  - 問題メタ更新（displayLabel/canonicalKey/tags等）

---

## Kanji（漢字）

- POST /api/kanji
  - 漢字1件作成
- POST /api/kanji/import
  - 一括インポート（text形式）
- GET /api/kanji
  - 漢字一覧（検索/ページング）
  - Query: q, limit, cursor

---

## Attempts（正誤履歴: 追記型）

- POST /api/questions/{questionId}/attempts
  - 問題の正誤を記録（CORRECT/WRONG）
- GET /api/questions/{questionId}/status
  - 問題の派生状態（currentState/streak/dueDate/excluded/lastAttemptDate）
- POST /api/kanji/{kanjiId}/attempts
  - 漢字の正誤を記録
- GET /api/kanji/{kanjiId}/status
  - 漢字の派生状態

---

## Review Tests（復習テスト: 生成/ロック/ライフサイクル）

- POST /api/review-tests
  - テスト生成（決定論ソート + ロック取得）
- GET /api/review-tests
  - テスト一覧（status/subject/ページング）
  - Query: status, subject, limit, cursor
- GET /api/review-tests/{testId}
  - テスト詳細（items + 参照メタ）
- PATCH /api/review-tests/{testId}
  - ステータス更新（PAUSED/IN_PROGRESS/COMPLETED/CANCELED）
- DELETE /api/review-tests/{testId}
  - テスト削除（必ずロック解除）

---

## Review Test Results（テスト結果入力: まとめて入力）

- POST /api/review-tests/{testId}/results
  - テスト結果を一括登録（対象ごとの正誤、オプションで「全正解」等の簡易入力モード）
  - 登録に伴い該当targetのロック解除
