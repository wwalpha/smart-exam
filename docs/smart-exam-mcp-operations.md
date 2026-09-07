# Smart Exam read-only MCP サーバー運用

## 実装と範囲

業務Contract 1.0.0、公式 `@modelcontextprotocol/sdk` 1.30.0 を完全固定する。採用protocolは2025-11-25。SDKが持つ過去4版のinitializeも隔離HTTP試験で検証する。2026-07-28には対応を宣言しない。

- `backend/src/mcp/schema.ts`: 7 Toolsのstrict input/output schema、共通品質情報、業務エラー。
- `backend/src/mcp/handler.ts`: API Gateway v2 → SDK Web Standard Streamable HTTP。requestごとに生成・破棄するstateless transport。
- `backend/src/services/learningRead/`: 原値の読取・結合、ページング、hash、既存PDFアクセス。
- `backend/src/repositories/learningRead/`: AWS SDKのGet/Query/Scan/List/Head/署名GETだけを公開する境界。
- `terraform/mcp.tf`: 専用Lambda/IAM/Cognito client/read scope/group/JWT authorizer/routes/logs/alarm。既存7テーブル・S3・HTTP API・User Poolを参照する。

REST mapperは日付fallbackや正誤の優先値選択を行い、既存Repositoryの対象別取得は500/200件等で打ち切るためMCPでは使用しない。DateUtilsと既存のtable・GSI・S3 key規則を再利用し、SDKの生の継続キーとAbortSignalを扱う専用read Repositoryを追加した。復習周期や習得ロジックの再実装はない。PDF生成・OCR・Bedrock・DB更新サービスをimportしない。

## 学習事実とページング

`get_material/QUESTIONS`は全初回結果、`get_exam/ITEMS`は明細seqと元結果の照合を返す。本人回答・点数・実施時刻は補作しない。問題番号はcanonicalKey、MATERIALのquestionTextはnull。漢字は現行masterの本文・読み・下線・正答を返す。

不一致はCONFLICT、未採点はUNGRADED、未完了はPROVISIONAL。親やmasterが欠落しても残存明細を保持する。Exam.resultsだけに残る結果はSOURCE_ONLYで別ページに出し、架空のseqを付けない。対象別GSIでは孤立結果を完全発見できないため、全試験ITEMSとの照合が必要。

RESULTS、LIFECYCLE、REVIEW_STATEは別の意味を持つ。キューがないだけで習得と見なさない。LIFECYCLEのcorrectCountは原値であり正誤ではない。複数active候補はINCONSISTENT。

全collectionはpageSize既定50、最大100。DynamoDBのLastEvaluatedKey（途中縮小時は最終処理rowの主キー/GSI key）またはS3の最後のkeyで継続する。空itemsでもnextCursorがあれば取得を続ける。検索順はUNSPECIFIED、totalはnull。LIVEであり同時点snapshotではない。

cursorは環境・tool・view・filterをAADとするAES-256-GCMのopaque token。認可の代わりには使わない。pageSizeを下げても同じ条件で継続できる。内部予算20秒、Lambda25秒、tool応答256KiB。返却できるrecordを境界に縮小し、1 recordでも収まらなければRESPONSE_TOO_LARGE。上流異常は安全なコードのみ返す。

hashはobjectキーを辞書順にし、配列順と文字列は保存どおり保持する。出力の不明値はnull、objectのundefinedは省略。原正誤・原日付・参照元を含み、observedAt/requestId/暗号化fileRef/署名URL/期限は含めない。rawOccurredOnは保存された原日付、occurredOnは有効な日付だけ。初回choiceも過去日の採点訂正もhash変化として観測できる。

## 保存済みPDF

教材の `materials/<native materialId>/{QUESTION,ANSWER,GRADED_ANSWER}/` と試験の `exams/<native examId>.pdf` を照合する。教材FILESは現在選択されたobjectと別版をページングする。Content-Typeがapplication/pdfの保存済みobjectのみ署名対象。未生成の試験PDFはNOT_GENERATEDで終了する。

fileRefを復号して親レコード・許可prefix・object存在・ETag/VersionIdを再検証し、300秒の署名GETを返す。任意bucket/key/URLを入力できない。VersionIdがある場合はそのversionを指定する。VersioningのないobjectはHEAD後の同時上書きまで固定するものではなく、過去版再取得を保証しない。

署名URL、token、学習データをログへ出さない。ログはrequestId/tool/経過時間/応答bytes/errorCodeのみ。テストは合成fixtureを使い、実データをCI artifactへ保存しない。

## 環境と必須設定

今回指定された対象は **staging**。

| 項目 | staging | prod |
|---|---|---|
| workflow | deploy.yml | deploy-prod.yml |
| GitHub Environment | staging（現行式による） | prod |
| region | ap-northeast-1 | us-east-1 |
| deploy_environment | dev（現行既定） | prod |
| backend bucket | arms-terraform-0606 | terraform-state-202106 |
| backend key | smartexam/terraform.tfstate | smartexam/terraform.tfstate-us-east-1 |
| backend region | us-east-1 | us-east-1 |
| 起動 | master/main push または workflow_dispatch | 既存のrelease published/editedのみ |

既存のAWS_IAM_ROLE_ARN/OIDCを再利用する。新規releaseや承認回避は行わない。stagingとprodのstateやregionを相互流用しない。

各Environmentに次を設定する。

- **MCP_CALLBACK_URLS（必須Variable）**: Cognitoに事前登録する完全なcallback URLのJSON配列。値が未提供ならplan/apply前に停止する。推測値・wildcardを使わない。
- MCP_ALLOWED_SUBJECTS（任意Variable）: 明示的に承認したCognito subのJSON配列。既定 `[]`。または専用MCP_READERSグループへの所属で許可する。既存利用者を自動で所属させない。
- MCP_ALLOWED_ORIGINS（任意Variable）: 許可するOriginのJSON配列。既定 `[]` ではOriginなしの認証済みCLIを許可し、Origin付きは拒否する。既存API全体のCORSは変更しない。
- MCP_SMOKE_ACCESS_TOKEN（任意Secret）: 既存の安全な試験手段で取得した短命MCP access tokenが利用できる場合のみ。資格情報を変更・再発行して用意しない。

MCPは全環境でJWT必須。Gatewayで署名・issuer・resource audience・scopeを検証し、Lambdaでclient_id/token_use/期限/許可利用者を再確認する。access tokenはresourceに完全なMCP endpointを指定するAuthorization Code + PKCE S256の利用を前提とする。Web/mobile clientをMCP audienceへ追加しない。prodのWeb authorizerもMCP clientを追加しない。既存dev RESTは元々認証無効のため、MCP scope付きtokenのREST転用のみを拒否するmiddlewareを追加し、既存の匿名/通常token経路を維持する。この拒否処理はJWT payloadを認証に利用しない。

## Actions経路

ローカルではTerraformを一切実行しない（fmt/init/validate/planを含む）。

1. MCP Checks: immutable install → api-types build → backend typecheck → 変更範囲lint → `test:mcp`（SDK transportと関連Web/iOS回帰）→ plan guard試験 → WebとMCPのbuild/package。
2. MCP artifactは `backend/mcp.zip`（mcp.js/package.jsonのみ）、handlerはmcp.handler。Webのfunction.zip/index.handlerと混在させない。
3. MCP_BUILD_IDに同一commitのSHAを渡し、artifact内へ埋め込む。runtime環境変数だけで旧codeを新buildとして表示しない。
4. Actions内でTerraform fmt check/init/validate。デプロイjobは元の環境backendをinitし、saved planを検査して同じplanだけをapply。
5. plan guardは削除/再作成とMCP以外の変更を拒否する。既存stageの変更はMCP POSTルートのrate2/burst5の追加だけ許可する。plan/stateをartifactとしてuploadしない。
6. 同じrunのMCP artifactを専用Lambdaへupdateし、function-updated-v2完了を待つ。
7. API作成したMCP client専用のmanaged-login brandingが未作成ならActions内のCognito APIで既定styleを一度作成する（既存styleは維持）。既存AWS provider 5.xに対応resourceがないため、provider全体の更新は避ける。このstyleはTerraform state外でCognito clientに付随して管理する。
8. metadataと未認証HTTPS拒否、Lambda context/build、IAM write-denial policy simulationを実施する。既存tokenがあるときだけ認証済みHTTPSを試験する。

Lambda直接invokeは隔離したtrusted contextを渡す試験であり、OAuth/JWT authorizerを通った試験ではない。IAM simulationは業務データに書き込まず拒否判定を調べるもので、実際のwrite API実行ではない。どちらも認証済みHTTPS成功と取り違えない。

## 検証状況と制限

- SDK Client → localhost HTTP → 本番handler → read service → 本物のAWS SDK → 専用HTTP fixtureで検証。AWS認証やAWS service自体の実証ではない。
- fixtureは教材/複数MATERIAL試験/漢字再試験/履歴/保存済みPDFを含み、元ID・正誤・日付・本文の一致を検査する。
- 507件、byte境界、空ページ+cursor、不正/条件流用cursor、出力サイズ、採点不一致、親/master欠落、孤立結果、未確定、訂正hash、未生成PDFの書込ゼロ、認可拒否、ログ非漏洩を検査する。
- 元commit `89e2e8d105b6877ea45bfa3f13b9124a57733030` でも全backend suiteは7失敗/46成功/2skip。PDF controllerテストの旧buffer期待値は今回の関連回帰として現行downloadUrl契約へ修正。その他6件（漢字生成/import fixture、候補終了履歴の旧期待値）は今回範囲外で保持する。
- 全backend lintの既存5違反（漢字/問題生成のprefer-const、漢字削除の未使用変数、旧テストany）は未修正。CIのlint/testは上記変更範囲を明示して実行する。
- AWSデプロイ/認証済みHTTPSは別途run結果を記録する。callback URL未設定はデプロイblockであり、7 Tools実装や隔離試験のblockではない。

## 接続用の非秘密outputs

デプロイ後にActionsのTerraform outputsから `mcp_endpoint`、`mcp_discovery_url`、`mcp_issuer`、`mcp_client_id`、`mcp_scope`、`mcp_lambda_function_name` を取得する。scopeは `smart-exam-mcp/read`。staging endpointとclient IDは実際のoutputsを確認するまで未確定とする。prodの設計URLをstaging値として流用しない。

## レビュー

専用IAMは読取と専用log書込のみAllowし、業務書込・Bedrock・他Lambda invokeを明示Denyする。fileRef/cursorは暗号化と用途bindingを行い、毎回認可する。署名/本文のログ出力、生成Service参照、元REST認証設定の書換えを行っていないことを確認する。

性能はpageSizeと20秒予算で制限する。master/親/PDFのHEADを伴うページでは複数readが発生する。大きな試験のSUMMARY/孤立結果診断およびREVIEW_STATEは全関連rowを確認するため、予算超過時はUPSTREAM_UNAVAILABLEとして再取得を要求する。全件確認できていない状態を「問題なし」「候補なし」として成功させない。


API作成clientはbrandingを自動付与されず、未設定ではログイン画面を利用できない（[AWS CreateUserPoolClient](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateUserPoolClient.html)、[CreateManagedLoginBranding](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateManagedLoginBranding.html)）。Actions roleには当該User Poolの `cognito-idp:DescribeManagedLoginBrandingByClient` / `cognito-idp:CreateManagedLoginBranding` も必要。MCP実行roleへは付与しない。

## 実施記録（2026-09-07）

サーバー実装commit: `fc91dad0e6639875f03610c6d2c087d5a56641fa`、branch: `codex/read-only-mcp`。

- ローカル: `test:mcp` 59件成功、plan guard/branding運用試験6件成功、typecheck・変更範囲lint・build/package成功。
- 全backendの最終確認: 79成功・既存6失敗・既存2skip。変更前との比較と失敗範囲は上記参照。
- [MCP Checks run 34102920345](https://github.com/wwalpha/smart-exam/actions/runs/34102920345): 成功。固定install、同試験、artifact内build ID、Terraform fmt/init（backendなし）/validateまで確認。
- [staging Deploy run 34103014151](https://github.com/wwalpha/smart-exam/actions/runs/34103014151): checks成功後、`Require exact MCP callback configuration`で停止。`staging.MCP_CALLBACK_URLS`が空だった。AWS credentials設定・state backend init・plan・apply・Lambda更新・AWS smokeは未実行。
- したがってAWS反映なし。MCP endpoint/client IDの実outputs、Cognito branding、IAM実環境simulation、認証済みHTTPSは未検証。scopeだけはContract上の `smart-exam-mcp/read` と確定している。

完全なcallback URLが提示され、stagingのMCP_CALLBACK_URLSに設定された後に、同じ正規Deploy workflowを再実行する。利用許可は明示sub allowlistまたはMCP_READERS所属で別途確認する。既存資格情報の変更・認証bypass・本番release作成は行っていない。
