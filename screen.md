# Frontend 画面名と TSX ファイル対照表

このファイルは、frontend の「画面名（ページタイトル）」と対応する TSX ファイルを一覧化したものです。

- ルーティングの出典: frontend/src/App.tsx
- TSX 一覧の出典: `frontend/src/pages/**/*.tsx`

## ルーティング登録済み（App.tsx の Routes）

| 画面名（pageTitle/メニュー） | ルート                        | TSX                                          |
| ---------------------------- | ----------------------------- | -------------------------------------------- |
| ダッシュボード               | `/`                           | DashboardPage.tsx                            |
| 教材セット一覧               | `/materials`                  | materials/MaterialSetListPage.tsx            |
| 教材セット登録               | `/materials/new`              | materials/MaterialSetCreatePage.tsx          |
| 教材セット詳細               | `/materials/:id`              | materials/MaterialSetDetailPage.tsx          |
| 問題管理                     | `/materials/:id/questions`    | materials/QuestionManagementPage.tsx         |
| 問題テスト履歴（一覧）       | `/materials/attempts`         | materials/QuestionAttemptHistoryListPage.tsx |
| 問題テスト履歴（詳細）       | `/materials/:id/attempts`     | materials/QuestionAttemptHistoryPage.tsx     |
| 問題復習テスト一覧           | `/exam/questions`             | review/ExamQuestionListPage.tsx              |
| 問題復習テスト作成           | `/exam/questions/new`         | review/ExamQuestionCreatePage.tsx            |
| 問題復習テスト詳細           | `/exam/questions/:id`         | review/ExamQuestionDetailPage.tsx            |
| 問題復習テスト採点           | `/exam/questions/:id/grading` | review/ExamQuestionGradingPage.tsx           |
| 問題復習テストPDF            | `/exam/questions/:id/pdf`     | review/ExamQuestionPdfPage.tsx               |
| 漢字復習テスト一覧           | `/exam/kanji`                 | review/ExamKanjiListPage.tsx                 |
| 漢字復習テスト作成           | `/exam/kanji/new`             | review/ExamKanjiCreatePage.tsx               |
| 漢字復習テスト詳細           | `/exam/kanji/:id`             | review/ExamKanjiDetailPage.tsx               |
| 漢字復習テスト採点           | `/exam/kanji/:id/grading`     | review/ExamKanjiGradingPage.tsx              |
| 漢字復習テストPDF            | `/exam/kanji/:id/pdf`         | review/ExamKanjiPdfPage.tsx                  |
| 漢字一覧                     | `/kanji`                      | kanji/KanjiListPage.tsx                      |
| 漢字登録                     | `/kanji/new`                  | kanji/KanjiCreatePage.tsx                    |
| 漢字編集                     | `/kanji/:id`                  | kanji/KanjiCreatePage.tsx                    |
| 漢字一括登録                 | `/kanji/import`               | kanji/KanjiImportPage.tsx                    |
| 漢字テスト履歴（一覧）       | `/kanji/attempts`             | kanji/KanjiAttemptHistoryListPage.tsx        |
| 漢字テスト履歴（詳細）       | `/kanji/:id/attempts`         | kanji/KanjiAttemptHistoryPage.tsx            |
| 問題検索                     | `/search/questions`           | search/QuestionSearchPage.tsx                |
| PDF設定                      | `/settings/pdf`               | settings/PdfSettingsPage.tsx                 |

## ルーティング未登録（pages 配下だが App.tsx から直接参照されない）

| 画面/部品名（推定）      | 想定ルート（コード内に文字列がある場合） | TSX                                   | 備考                                                        |
| ------------------------ | ---------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| 単語テスト（一覧）       | `/wordtest`                              | wordtest/WordTestPage.tsx             | App.tsx に Route が無いが、画面内 Link で遷移先が参照される |
| 単語テスト（詳細）       | `/wordtest/:id`                          | wordtest/WordTestDetailPage.tsx       | タイトルは `test.name`（動的）                              |
| 単語テスト（採点）       | `/wordtest/:id/grading`                  | wordtest/WordTestGradingPage.tsx      | タイトルは `test.name - 採点`（動的）                       |
| 単語テスト作成ダイアログ | -                                        | wordtest/WordTestCreateDialog.tsx     | `WordTestPage` から利用される Dialog                        |
| 単語データ管理           | -                                        | wordmaster/WordMasterPage.tsx         | App.tsx に Route が無い                                     |
| 単語データ登録ダイアログ | -                                        | wordmaster/WordMasterCreateDialog.tsx | `WordMasterPage` から利用される Dialog                      |
