GITHUB actionsのエラーを確認し、解消する。下記情報を使う

## GitHub Actions（gh）

- 事前にログイン: `gh auth login`
- 直近の失敗 run 一覧: `gh run list --limit 10`
- 失敗 run の詳細: `gh run view <run_id> --log-failed`

## OpenAPI(Mock API)

- OpenAPI 定義: `docs/swagger.yml`
- Mock サーバー起動: `yarn mock:api`（port 4010）

Environment secrets
AWS_ACCOUNT_ID
AWS_IAM_ROLE_ARN
Environment variables

TERRAFORM_BACKEND_BUCKET

TERRAFORM_BACKEND_KEY

TERRAFORM_BACKEND_REGION

