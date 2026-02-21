# Backend API 一覧

本書は [要件定義書\_v1.2.md](../要件定義_v1.2.md) をベースに、Smart Exam の Backend API の「一覧」を記載します。

実装上の正は Backend のルーティング定義（`backend/src/app/createApp.ts`）とし、本書は「エンドポイントの棚卸し」に留めます。

- フロントエンド画面設計: [docs/frontend.md](frontend.md)
- Request / Response の詳細定義は [docs/swagger.yml](swagger.yml) に記載します。
- DynamoDB のテーブル定義は [docs/dynamodb_tables.md](dynamodb_tables.md) に記載します。

---

| カテゴリ | メソッド | パス | 概要 | Frontend利用 |
| --- | --- | --- | --- | --- |
| 共通 | GET | `/health`, `/v1/health` | アプリケーションの稼働状態を確認するヘルスチェックAPI | - |
| S3 | POST | `/api/upload-url` | S3へアップロードするための署名付きURLを発行するAPI | ✅ |
| Bedrock | POST | `/api/analyze-paper` | 試験用紙を解析して構造化データを生成するAPI | ✅ |
| Dashboard | GET | `/api/dashboard` | ダッシュボード表示用の集計情報を取得するAPI | ✅ |
| Materials | GET | `/api/materials` | 教材一覧を取得するAPI | - |
| Materials | POST | `/api/materials/search` | 条件を指定して教材を検索するAPI | ✅ |
| Materials | POST | `/api/materials` | 新しい教材を作成するAPI | ✅ |
| Materials | GET | `/api/materials/:materialId` | 指定した教材の詳細を取得するAPI | ✅ |
| Materials | PATCH | `/api/materials/:materialId` | 指定した教材の情報を更新するAPI | ✅ |
| Materials | DELETE | `/api/materials/:materialId` | 指定した教材を削除するAPI | ✅ |
| Materials | GET | `/api/materials/:materialId/files` | 指定した教材に紐づくファイル一覧を取得するAPI | ✅ |
| Materials | GET | `/api/materials/:materialId/files/:fileId` | 指定した教材ファイルの詳細を取得するAPI | ✅ |
| Kanji | POST | `/api/kanji/search` | 条件を指定して漢字データを検索するAPI | ✅ |
| Kanji | POST | `/api/kanji` | 漢字データを新規作成するAPI | ✅ |
| Kanji | GET | `/api/kanji/:kanjiId` | 指定した漢字データの詳細を取得するAPI | ✅ |
| Kanji | PATCH | `/api/kanji/:kanjiId` | 指定した漢字データを更新するAPI | ✅ |
| Kanji | DELETE | `/api/kanji/:kanjiId` | 指定した漢字データを削除するAPI | ✅ |
| Kanji | POST | `/api/kanji/deletions` | 複数の漢字データを一括削除するAPI | ✅ |
| Kanji | POST | `/api/kanji/import` | 漢字データを一括インポートするAPI | ✅ |
| Questions | POST | `/api/questions/search` | 条件を指定して問題を検索するAPI | - |
| Questions | GET | `/api/materials/:materialId/questions` | 指定した教材に紐づく問題一覧を取得するAPI | ✅ |
| Questions | POST | `/api/materials/:materialId/questions` | 指定した教材に新しい問題を追加するAPI | ✅ |
| Questions | PATCH | `/api/questions/:questionId` | 指定した問題を更新するAPI | ✅ |
| Questions | PUT | `/api/questions/:questionId/review-candidate` | 指定した問題の復習候補を作成または更新するAPI | ✅ |
| Questions | DELETE | `/api/questions/:questionId/review-candidate` | 指定した問題の復習候補を削除するAPI | ✅ |
| Questions | DELETE | `/api/questions/:questionId` | 指定した問題を削除するAPI | ✅ |
| Exam (Kanji) | POST | `/api/exam/kanji/search` | 条件を指定して漢字テストを検索するAPI | ✅ |
| Exam (Kanji) | POST | `/api/exam/kanji` | 漢字テストを新規作成するAPI | ✅ |
| Exam (Kanji) | GET | `/api/exam/kanji/targets` | 漢字テスト作成対象の候補一覧を取得するAPI | ✅ |
| Exam (Kanji) | GET | `/api/exam/kanji/:examId` | 指定した漢字テストの詳細を取得するAPI | ✅ |
| Exam (Kanji) | GET | `/api/exam/kanji/:examId/pdf` | 指定した漢字テストのPDF情報を取得するAPI | ✅ |
| Exam (Kanji) | PATCH | `/api/exam/kanji/:examId` | 指定した漢字テストのステータスを更新するAPI | ✅ |
| Exam (Kanji) | DELETE | `/api/exam/kanji/:examId` | 指定した漢字テストを削除するAPI | ✅ |
| Exam (Kanji) | POST | `/api/exam/kanji/:examId/results` | 指定した漢字テストの結果を登録するAPI | ✅ |
| Exam (Question) | POST | `/api/exam/question/search` | 条件を指定して問題テストを検索するAPI | ✅ |
| Exam (Question) | POST | `/api/exam/question` | 問題テストを新規作成するAPI | ✅ |
| Exam (Question) | GET | `/api/exam/question/targets` | 問題テスト作成対象の候補一覧を取得するAPI | ✅ |
| Exam (Question) | GET | `/api/exam/question/:examId` | 指定した問題テストの詳細を取得するAPI | ✅ |
| Exam (Question) | GET | `/api/exam/question/:examId/pdf` | 指定した問題テストのPDF情報を取得するAPI | ✅ |
| Exam (Question) | PATCH | `/api/exam/question/:examId` | 指定した問題テストのステータスを更新するAPI | ✅ |
| Exam (Question) | DELETE | `/api/exam/question/:examId` | 指定した問題テストを削除するAPI | ✅ |
| Exam (Question) | POST | `/api/exam/question/:examId/results` | 指定した問題テストの結果を登録するAPI | ✅ |
| Exam Candidates | GET | `/api/review-test-candidates` | 復習テスト候補の一覧を取得するAPI | ✅ |
| Review Attempts | GET | `/api/exam-attempts` | 復習テストの実施履歴を参照する読み取り専用API | ✅ |
