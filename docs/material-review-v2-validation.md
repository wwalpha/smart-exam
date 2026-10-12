# MATERIAL復習5回ルール：実装・検証記録

2026-10-12 JST。比較元HEAD: `5e0df59247f87b7100ed1680df37f4e1f90c8b32`。変更は未コミット・未ステージ。本番DynamoDBの読み書き、移行apply、本番デプロイは行っていない。applyの実行は一時DynamoDB Localの合成fixtureのみ。

## 結果

| 確認 | 実行結果 |
|---|---|
| `yarn workspace smart-exam-backend typecheck` | exit 0。移行スクリプトも対象 |
| `yarn workspace smart-exam-backend lint` | exit 0 |
| 関連Vitest＋DynamoDB Local | 5ファイル／32件PASS。19件は実DynamoDB Localのサービス・整合性検証 |
| 全体 `yarn workspace smart-exam-backend test` | 89 PASS／6 FAIL／21 SKIP（116件）。既存の失敗6件と同じ。統合19件はこの既定コマンドではSKIPだが別途実行済み |
| 変更前の全体テスト | 79 PASS／6 FAIL／2 SKIP（87件） |
| 既存KANJI Localテスト | 1 PASS／1 FAIL。変更前コードでも同じ `readingHiragana is not found in question` を再現 |
| `terraform -chdir=terraform fmt -check iam.tf` | exit 0。apply・planは未実施 |
| `git diff --check` | exit 0 |
| 追加確認 `yarn workspace smart-exam-backend build` | 既存TS6059で失敗。変更前でも同じ。`backend/typings/learningRead.ts` がbuildのrootDir `src`外 |

[関連テストの実行ログ](validation/material-review-v2/related-vitest.log)、[変更前・後の失敗比較](validation/material-review-v2/comparison.json)。関連テスト最終実行は09:55:44 JST、32 PASS、3.50秒。Dockerは起動できず、AWS公式DynamoDB Local 1.25.1と一時Amazon Corretto 21でlocalhost:18765を使用した。検証後にJavaプロセスを終了した。システムへのJavaインストールはしていない。

## 計測・移行・回復

- `reviewCount`と`countedExamIds`のString Setで問題単位の累計を保存し、最大5回。同じ試験IDと明細の処理済み記録で二重加算を拒否する。1～4回は正誤に関係なく次回候補、5回は候補なし。初回教材choiceは回数を更新しない。
- 全ページのexams／exam_detailsからCOMPLETED＋MATERIAL＋booleanだけを集計し、同一試験・問題を重複排除する。明細正誤不足はexams.resultsと突き合わせる。矛盾はapply前に停止する。旧EXCLUDEDの1～4回は最後の正誤と実施日から候補を復帰し、5回は除外を維持する。過去の履歴を削除しない。
- カウンタ・Set・候補・履歴・reviewProcessedを問題ごとに同時確定する。採点トークンと完了開始状態で採点途中の完了、完了途中の再採点／削除を防ぐ。途中失敗は同じAPI・スクリプトで再開する。試験削除で確定済みの累計を減算しない。
- version 2未設定は通常処理を409で止める。移行済みカウンタを残存履歴だけで上書きしない。5回未満で、Setにない完了試験が残る場合は未計上異常として停止する。
- KANJIの完了経路は既存処理を通り、除外判定3回・間隔7／30／90日を維持する。実DBで3回目の正解後EXCLUDEDを確認した。KANJIファイルの変更は既存Lint違反のconst化・未使用変数の除去・テスト型指定だけで、判定や間隔を変えていない。

検証ケース内では累計値不一致0、二重計上0、5回到達後候補0。これは本番全データに対する検査結果ではない。

## 実DBで検証した内容

過去0＋正解→1、過去4＋正解／不正解→5、4連続正解で残る、5連続不正解で除外、未採点・初回教材採点で増えない、完了API8件同時実行と再送、LOCKED候補欠落時の計上と監査記録、問題トランザクションの条件失敗による全体ロールバック、1問題確定後の再開、確定後レスポンス喪失、採点同期失敗からの再採点、ステータスAPI経由完了、完了後削除、候補再生成の拒否、部分更新によるカウンタ保持、旧除外復帰と期限到来後の出題、移行途中失敗後の再開、移行CLIの既定dry-run／apply／再apply、601履歴・1MB超のページ境界、教材削除で他問題の処理済み属性を保持、削除後の再保存拒否、KANJIの3連続正解除外。

## 残っている制約

全体テストの既存6失敗は、KANJIの候補選択fixture3件、履歴fixture1件、KANJI importの不足mock2件。変更前と同じで、新しい失敗は0。既存KANJI Localの読みfixture不整合と標準build設定のTS6059も残る。今回のMATERIAL仕様変更に合わせてKANJI実装を変える修正はしていない。

削除の痕跡もなく失われた過去履歴は推測できない。移行は保存済みデータ全体をメモリに読むため、本番量での時間・メモリ測定は未実施。`--maintenance-confirmed`自体は稼働中サービスを停止しないため、運用の停止手順が必要。異常な重複が1問題100トランザクション操作を超える場合は自動修復せず停止する。

本番IAM・移行・デプロイ・バックアップ復元の実行確認はしていない。[停止・バックアップ・適用・ロールバック手順](material-review-v2.md)に従い、明示指示があるまで本番apply／デプロイを実行しない。

## 変更ファイルと主要行

| ファイル | 主要変更 |
|---|---|
| [backend/README.md:1](/Users/macmini/Documents/projects/smart-exam/backend/README.md:1) | 移行コマンド・手順へのリンク |
| [backend/package.json:17](/Users/macmini/Documents/projects/smart-exam/backend/package.json:17) | 移行Yarnコマンド追加 |
| [backend/scripts/migrate-material-review-v2.ts:1](/Users/macmini/Documents/projects/smart-exam/backend/scripts/migrate-material-review-v2.ts:1) | 既定dry-run／明示applyと前後比較・レポート |
| [backend/src/lib/materialReviewPolicy.ts:4](/Users/macmini/Documents/projects/smart-exam/backend/src/lib/materialReviewPolicy.ts:4) | 初期化とカウンタ／Set整合性の検証 |
| [backend/src/lib/reviewNextTime.ts:18](/Users/macmini/Documents/projects/smart-exam/backend/src/lib/reviewNextTime.ts:18) | MATERIALの早期除外を廃止、KANJI間隔を維持 |
| [backend/src/repositories/createRepositories.ts:37](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/createRepositories.ts:37) | 専用リポジトリの束縛 |
| [backend/src/repositories/examCandidates/bulkCreateCandidates.ts:8](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/examCandidates/bulkCreateCandidates.ts:8) | MATERIAL候補作成・ロック・解除・件数整合性 |
| [backend/src/repositories/examCandidates/createCandidate.ts:11](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/examCandidates/createCandidate.ts:11) | MATERIAL候補作成・ロック・解除・件数整合性 |
| [backend/src/repositories/examCandidates/lockCandidateIfUnlocked.ts:12](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/examCandidates/lockCandidateIfUnlocked.ts:12) | MATERIAL候補作成・ロック・解除・件数整合性 |
| [backend/src/repositories/examCandidates/releaseLockIfMatch.ts:11](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/examCandidates/releaseLockIfMatch.ts:11) | MATERIAL候補作成・ロック・解除・件数整合性 |
| [backend/src/repositories/examCandidates/syncMaterialOpenCandidateCount.ts:8](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/examCandidates/syncMaterialOpenCandidateCount.ts:8) | MATERIAL候補作成・ロック・解除・件数整合性 |
| [backend/src/repositories/examDetails/updateResults.ts:9](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/examDetails/updateResults.ts:9) | 明細部分更新で処理済み属性を保持 |
| [backend/src/repositories/exams/get.ts:9](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/exams/get.ts:9) | 強整合参照／MATERIAL上書き・直接状態更新の制御 |
| [backend/src/repositories/exams/put.ts:9](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/exams/put.ts:9) | 強整合参照／MATERIAL上書き・直接状態更新の制御 |
| [backend/src/repositories/exams/updateStatus.ts:9](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/exams/updateStatus.ts:9) | 強整合参照／MATERIAL上書き・直接状態更新の制御 |
| [backend/src/repositories/materialQuestions/bulkCreate.ts:4](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialQuestions/bulkCreate.ts:4) | 新規0回初期化・部分更新・消失／復活防止 |
| [backend/src/repositories/materialQuestions/bulkUpdateChoices.ts:21](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialQuestions/bulkUpdateChoices.ts:21) | 新規0回初期化・部分更新・消失／復活防止 |
| [backend/src/repositories/materialQuestions/create.ts:6](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialQuestions/create.ts:6) | 新規0回初期化・部分更新・消失／復活防止 |
| [backend/src/repositories/materialQuestions/get.ts:9](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialQuestions/get.ts:9) | 新規0回初期化・部分更新・消失／復活防止 |
| [backend/src/repositories/materialQuestions/update.ts:9](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialQuestions/update.ts:9) | 新規0回初期化・部分更新・消失／復活防止 |
| [backend/src/repositories/materialReviews/candidates.ts:8](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialReviews/candidates.ts:8) | 強整合候補取得・重複登録防止 |
| [backend/src/repositories/materialReviews/index.ts:5](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialReviews/index.ts:5) | MATERIAL専用リポジトリ公開 |
| [backend/src/repositories/materialReviews/processQuestion.ts:13](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialReviews/processQuestion.ts:13) | 問題単位の原子的計上・履歴・候補・処理済み記録 |
| [backend/src/repositories/materialReviews/workflow.ts:23](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materialReviews/workflow.ts:23) | 採点固定・完了確定・削除制御 |
| [backend/src/repositories/materials/get.ts:7](/Users/macmini/Documents/projects/smart-exam/backend/src/repositories/materials/get.ts:7) | 強整合参照／MATERIAL上書き・直接状態更新の制御 |
| [backend/src/services/exam/completeExam.ts:17](/Users/macmini/Documents/projects/smart-exam/backend/src/services/exam/completeExam.ts:17) | MATERIAL完了を累計処理へ分岐 |
| [backend/src/services/exam/createExamKanji.ts:75](/Users/macmini/Documents/projects/smart-exam/backend/src/services/exam/createExamKanji.ts:75) | 既存Lint違反のみ修正、動作同一 |
| [backend/src/services/exam/createExamQuestion.ts:122](/Users/macmini/Documents/projects/smart-exam/backend/src/services/exam/createExamQuestion.ts:122) | 未移行・5回到達・削除済み問題の選択防止 |
| [backend/src/services/exam/deleteExam.ts:7](/Users/macmini/Documents/projects/smart-exam/backend/src/services/exam/deleteExam.ts:7) | 完了途中削除の拒否、確定回数を保持 |
| [backend/src/services/exam/submitExamResults.ts:17](/Users/macmini/Documents/projects/smart-exam/backend/src/services/exam/submitExamResults.ts:17) | MATERIAL採点のトークン同期 |
| [backend/src/services/exam/updateExamStatus.ts:17](/Users/macmini/Documents/projects/smart-exam/backend/src/services/exam/updateExamStatus.ts:17) | 直接完了の迂回を防止 |
| [backend/src/services/kanji/deleteKanji.ts:35](/Users/macmini/Documents/projects/smart-exam/backend/src/services/kanji/deleteKanji.ts:35) | 既存Lint違反のみ修正、動作同一 |
| [backend/src/services/kanji/deleteManyKanji.ts:71](/Users/macmini/Documents/projects/smart-exam/backend/src/services/kanji/deleteManyKanji.ts:71) | 既存Lint違反のみ修正、動作同一 |
| [backend/src/services/materialQuestions/applyChoices.ts:9](/Users/macmini/Documents/projects/smart-exam/backend/src/services/materialQuestions/applyChoices.ts:9) | 5回到達の再候補化を防止 |
| [backend/src/services/materialReviewMigration/index.ts:34](/Users/macmini/Documents/projects/smart-exam/backend/src/services/materialReviewMigration/index.ts:34) | 履歴集計・復帰・再開・検証 |
| [backend/src/services/materials/deleteMaterial.ts:4](/Users/macmini/Documents/projects/smart-exam/backend/src/services/materials/deleteMaterial.ts:4) | 他問題の処理済み情報を保持、強整合で候補削除 |
| [backend/src/types/db.ts:47](/Users/macmini/Documents/projects/smart-exam/backend/src/types/db.ts:47) | 累計／Set／政策版／候補キー／処理状態の型 |
| [backend/tests/lib/materialReviewPolicy.test.ts:1](/Users/macmini/Documents/projects/smart-exam/backend/tests/lib/materialReviewPolicy.test.ts:1) | 関連テスト／fixture（KANJIの型変更はLint対応のみ） |
| [backend/tests/repositories/MaterialQuestionsBulkUpdateChoices.test.ts:1](/Users/macmini/Documents/projects/smart-exam/backend/tests/repositories/MaterialQuestionsBulkUpdateChoices.test.ts:1) | 関連テスト／fixture（KANJIの型変更はLint対応のみ） |
| [backend/tests/services/MaterialReviewDynamoDbLocal.test.ts:1](/Users/macmini/Documents/projects/smart-exam/backend/tests/services/MaterialReviewDynamoDbLocal.test.ts:1) | 関連テスト／fixture（KANJIの型変更はLint対応のみ） |
| [backend/tests/services/MaterialReviewMigration.test.ts:1](/Users/macmini/Documents/projects/smart-exam/backend/tests/services/MaterialReviewMigration.test.ts:1) | 関連テスト／fixture（KANJIの型変更はLint対応のみ） |
| [backend/tests/services/kanji/deleteKanji.test.ts:2](/Users/macmini/Documents/projects/smart-exam/backend/tests/services/kanji/deleteKanji.test.ts:2) | 関連テスト／fixture（KANJIの型変更はLint対応のみ） |
| [backend/tests/setup/dynamodbLocal.ts:158](/Users/macmini/Documents/projects/smart-exam/backend/tests/setup/dynamodbLocal.ts:158) | Terraform準拠のテスト用テーブル・ループバック接続 |
| [backend/tsconfig.json:24](/Users/macmini/Documents/projects/smart-exam/backend/tsconfig.json:24) | 移行スクリプトも型検査 |
| [docs/material-review-v2-validation.md:1](/Users/macmini/Documents/projects/smart-exam/docs/material-review-v2-validation.md:1) | 運用・結果記録／検証証跡 |
| [docs/material-review-v2.md:1](/Users/macmini/Documents/projects/smart-exam/docs/material-review-v2.md:1) | 運用・結果記録／検証証跡 |
| [docs/validation/material-review-v2/comparison.json:1](/Users/macmini/Documents/projects/smart-exam/docs/validation/material-review-v2/comparison.json:1) | 運用・結果記録／検証証跡 |
| [docs/validation/material-review-v2/related-vitest.log:1](/Users/macmini/Documents/projects/smart-exam/docs/validation/material-review-v2/related-vitest.log:1) | 運用・結果記録／検証証跡 |
| [terraform/iam.tf:82](/Users/macmini/Documents/projects/smart-exam/terraform/iam.tf:82) | ConditionCheck権限を既存3テーブルに限定 |
