# MATERIAL復習5回ルールと移行運用

MATERIALのみ、完了した復習試験に含まれる採点済み問題を問題ID単位で累計し、5回目で除外する。正誤は回数に影響しない。通常教材のchoice、未採点、未完了は数えない。正解90日／不正解30日を維持する。KANJIの3連続正解除外と7／30／90日の間隔は維持する。

## 保存と整合性

- `material_questions.reviewCount`: 0～5。`countedExamIds`: 計上したexamIdのString Set（最大5、0回は属性なし）。`reviewPolicyVersion`: 2。
- `reviewCandidateKey`: 現在のMATERIAL候補キー。候補作成・復習計上時に条件付きトランザクションで更新し、同じ問題の重複候補を防ぐ。
- `correctCount`は連続正解のまま。MATERIALの除外判定には使用しない。移行で復帰する候補は、保存済み採点履歴の末尾から連続正解数を復元する。
- 未移行・不正なカウンタは409で停止する。既存問題を自動的に0回として扱わない。新規問題だけ0回／version 2で条件付き作成する。既存問題の再Putは拒否し、更新は部分更新する。
- MATERIAL採点は`gradingToken`を保存し、明細を24件ずつ部分更新し、完了後にトークンを取り除く。失敗時は採点APIの再送で復旧する。古い並行採点の明細書き込みはトークン条件で拒否する。
- 完了開始時に`completionStarted`と基準日を固定する。採点中には開始できず、開始後の採点・再オープン・削除を拒否する。ステータスAPIからのCOMPLETEDも完了処理へ進む。
- 問題ごとに、累計とSet、候補削除／再作成、CLOSED／EXCLUDED履歴、全該当明細の`reviewProcessed`を1つのトランザクションで確定する。同一examId＋questionIdは1回。重複明細も1回とする。
- 本体テーブルの強整合読み取りと、旧回数・候補キー・未処理明細への条件を使用する。途中失敗／レスポンス喪失／同時完了は処理済み明細を再確認し、安全に再送できる。
- 全明細の処理と教材OPEN件数再集計後にCOMPLETEDを保存する。処理途中の累計は再開用の確定記録なので、そこで手動減算しない。
- 完了済み試験を削除してもカウンタ・Set・監査履歴は減らさない。教材削除は該当明細だけ削除し、別教材問題の採点・処理済み記録を保持する。削除途中の教材は同じ削除APIを再送する。
- 新規テーブル／GSIは不要。非キー属性のため`terraform/dynamodb.tf`の変更は不要。LambdaのConditionCheck用権限を既存3テーブルに限定して`terraform/iam.tf`に追加した。

トランザクションは100操作を超える重複候補・明細を検出したら停止する。通常1問題あたり約7操作であり、試験全体を巨大トランザクションにしない。[AWSトランザクション仕様](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)、[ConditionCheckのIAM権限](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis-iam.html)参照。

## 集計元と停止条件

スクリプトはexams／exam_details／material_questions／exam_candidates／exam_histories／materialsを強整合Scanで全ページ取得する。既存の500件上限付き`listExamIdsByTargetId`を呼ばない。601試験・明細1MB超の実DBテストでページ境界を検証する。

MATERIAL＋COMPLETEDの試験だけを対象に、明細targetIdとbooleanのisCorrectを使用する。明細正誤がない場合だけexams.resultsから補完し、補完をレポートする。重複examId＋questionIdは排除し、最大5回にする。CLOSED／EXCLUDEDのレコード数を回数に転用しない。

矛盾した正誤、親試験不足、明細数と試験countの不一致、結果のみ存在する問題、壊れたカウンタ、重複／LOCKED候補、教材不足、旧除外の履歴不足はレポートしてapplyを止める。最終実施日が同じで正誤が異なり順序を特定できない場合も止める。未採点明細はレポートして計上しない。削除済み問題・教材を作り直さない。

保存された全データに履歴の痕跡がない問題は0回として初期化できるが、削除済み試験を復元したという意味ではない。削除の痕跡がない履歴欠落は検出できない。以前のEXCLUDEDや正解回数が残り、対応する復習履歴が見つからない場合は0回へ初期化しない。version 2のカウンタは再集計で上書きしないため、移行後に試験を削除した場合も値を保持し、残存履歴との差をレポートする。

旧EXCLUDED問題のうち、1～4回は最後の`submittedDate`（未保存なら`createdDate`）と正誤から候補日を再計算する。期限が過去でも日付を先送りせず出題可能にする。既存候補は再利用し、必要な日付変更だけ行い、重複候補を作らない。5回以上は候補を残さない。過去のEXCLUDED履歴は保存する。移行が削除・置換するのは予定候補だけで、試験・明細・問題・教材・履歴の削除はしない。

## 本番適用の手順（この作業では実施していない）

1. 対象アカウント／リージョン／6テーブル名を確認する。`AWS_PROFILE`、`AWS_DEFAULT_REGION`、全`TABLE_*`環境変数を対象環境に明示設定する。AWS_ENDPOINT_URLがローカルを指していないことも確認する。権限は読み取りに加え、applyには問題Update／候補Put・Delete／materials ConditionCheckが必要。
2. MATERIALの作成・採点・完了・候補再生成を停止する。教材作成・更新・削除、問題変更、試験削除、バッチ、直接DB書き込みも停止する。既存ハンドラにメンテナンススイッチはないため、該当ルートのゲート／バッチ停止で実施し、停止前の実行が終了するまで待つ。全テーブルをバックアップする場合はKANJI書き込みも止め、一貫した時点を確保する。
3. IN_PROGRESSのMATERIAL試験はapplyの停止条件。バックアップ後に、旧版の運用で採点・完了するか、解答の保存を確認して未完了試験を明示的に取り消す。勝手に完了扱い／累計計上しない。新実装でcompletionStartedのままの試験は完了APIを再送して先に完了させる。採点トークンが残った試験は採点APIを再送する。
4. 停止した状態で6テーブルのオンデマンドバックアップを取り、ARN・時刻・アカウントを記録する。復元先の別テーブルでバックアップを読み、既存データと件数を比較する。PITRだけでなく、停止時点の明確な復旧点を用意する。
5. dry-runを実行し、JSONの問題別beforeCount／historyCount／reviewCount／countedExamIds／nextTime、summary、issuesを確認する。beforeTotalは保存済みカウンタだけの合計で、未初期化分は含まない。異常を元データと照合し、推測で補完しない。削除済み履歴がある場合はバックアップからの明示的な復旧または既知の残存履歴のみで適用する判断を記録する。
6. レポート承認後、メンテナンスを維持して明示applyする。途中失敗時は同じコマンドを再送する。version 2の問題はスキップし、未移行問題だけをトランザクションで処理する。部分成功件数と再読込結果も失敗レポートに残る。
7. レポートのviolationsが0、問題別比較が一致、5回到達後候補0を確認する。もう一度applyしprocessedが0であることを確認する。候補日・旧EXCLUDED復帰・教材候補件数を確認する。
8. メンテナンス中に新バックエンドと限定IAM権限を適用する。最初のMATERIAL操作前に、全問題がversion 2であることを確認する。KANJIとMATERIALの動作確認後に再開する。

```sh
# 既定は読み取り専用。実行前に接続環境を必ず明示する。
yarn workspace smart-exam-backend migrate:material-review-v2 --report /tmp/material-review-v2-dry-run.json

# 運用担当者が停止・バックアップ・レビューを完了した後だけ実行する。
# この変更作業では本番の以下コマンドを実行していない。
yarn workspace smart-exam-backend migrate:material-review-v2 --apply --maintenance-confirmed --allow-remote-apply --backup-reference BACKUP_RECORD --report /tmp/material-review-v2-apply.json
```

ローカルapplyも`--maintenance-confirmed`が必要。リモートapplyはさらに`--allow-remote-apply`と`--backup-reference`が必要。引数不明・dry-run/applyの併記はエラー。レポートを書けない場合は初回の書き込み前に停止する。

## 復旧・ロールバック

- 問題単位の移行途中失敗はメンテナンスを継続し、保存済みJSONと問題レコードを比較して再applyする。既にversion 2の問題のカウンタを削除したり0へ戻したりしない。
- 完了途中失敗は同じ完了APIを再送する。累計だけの巻き戻し、候補だけの再生成、reviewProcessedの手動消去は禁止。採点と削除は固定されているため、未処理問題だけ再開できる。
- 適用を取り消す場合は再開前に停止を維持し、バックアップを別テーブル名へ復元する。6テーブルの整合した復旧点と旧バックエンドの組み合わせを検証してから、TABLE_*の向き先をまとめて切り替える。元テーブルを自動削除しない。候補キーとカウンタの整合性を保つため、問題テーブルだけの復旧をしない。
- 再開後に新たな採点がある場合、バックアップへの切り替えはその学習記録を失う。再停止して差分を保存し、個別に復旧計画を立てる。旧版だけへの切り戻しでは旧2連続正解ルールが再び動くため、version 2データのまま書き込みを再開しない。
- 今回は本番バックアップ・IAM適用・移行apply・デプロイ・バックアップ復元を実行していない。ロールバック手順の本番検証も未実施。

## 検証コマンド

```sh
yarn workspace smart-exam-backend typecheck
yarn workspace smart-exam-backend lint
yarn workspace smart-exam-backend exec vitest run tests/lib/materialReviewPolicy.test.ts tests/services/MaterialReviewMigration.test.ts

# DockerでDynamoDB Localを起動する通常構成
DDB_LOCAL_INTEGRATION=1 yarn workspace smart-exam-backend exec vitest run tests/services/MaterialReviewDynamoDbLocal.test.ts

# 既に起動した一時DynamoDB Localにも接続できる。ループバックURLだけ許可。
DDB_LOCAL_INTEGRATION=1 DDB_LOCAL_ENDPOINT=http://127.0.0.1:18765 AWS_ENDPOINT_URL=http://127.0.0.1:18765 AWS_DEFAULT_REGION=ap-northeast-1 AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test yarn workspace smart-exam-backend exec vitest run tests/services/MaterialReviewDynamoDbLocal.test.ts
```

本体DynamoDB Localテストは起動失敗を成功扱いにしない。作成・初回採点・5回除外・同時完了8件・失敗注入・移行途中再開・CLIのdry-run/apply/再apply・601件全ページ・削除・KANJI3連続正解を検証する。結果と変更ファイル一覧は`material-review-v2-validation.md`に記録する。
