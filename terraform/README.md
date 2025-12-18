# Terraform (Smart Exam)

このディレクトリは Smart Exam の AWS インフラを Terraform で構築するための最小構成です。

## 作るもの（最小）
- S3: ファイル保管（問題PDF、解答用紙PDF、採点済み用紙画像など）
- DynamoDB: アプリ用テーブル一式
- Lambda: Backend API（Terraform がダミーZIPを生成）
- API Gateway HTTP API: Lambda 統合（`$default` ルート）

## 事前準備
- Terraform v1.6+
- AWS 認証情報（環境変数や SSO 等）

## State（backend）
`backend.tf` の S3/DynamoDB ロックの値は、環境ごとに直書きして運用してください（backend ブロックは変数を参照できません）。

## 使い方
1. 変数を用意（例: `terraform.tfvars`）
2. 初期化/検証/適用

例:
- `terraform init`
- `terraform fmt -recursive`
- `terraform validate`
- `terraform plan`
- `terraform apply`

## Lambda アーティファクト
この Terraform は、`terraform/dummy/` を `archive_file` でZIP化して Lambda にデプロイします（ダミー実装）。

実アプリの Lambda をデプロイしたい場合は、`aws_lambda_function.api` の `filename` / `source_code_hash` / `handler` をビルド成果物に合わせて差し替えてください。

## デフォルト値
- `project_name`: `smartexam`
- `env`: `dev`

## 固定値
以下はパラメータではなく固定値です（[terraform/locals.tf](terraform/locals.tf)）。
- Lambda 関数名: `smartexam_dev_api`
- HTTP API 名: `smartexam_dev_http_api`
