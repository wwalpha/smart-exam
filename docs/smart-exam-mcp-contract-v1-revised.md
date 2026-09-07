# Smart Exam MCP Contract v1 詳細設計案（単一家庭・単一生徒）

設計日: 2026-09-07  
改訂日: 2026-09-07（利用範囲を単一家庭・単一生徒に確定）  
状態: サーバー実装に合わせて改訂。実装・検証状況とデプロイ前提は [MCP運用手順](smart-exam-mcp-operations.md) を参照。AWS反映・OAuth実環境試験の成功を本書だけで意味しない。

今回の実装範囲は7 Tools、読取サービス、schema、専用AWSリソース、Actions、サーバー試験。Codex接続、利用端末設定、分析repo、第1/第2run保存は今回の受入条件から除外する。

## 1. 目的と採用構成

Codex / GPT-6 Astra が手動実行時に Smart Exam の教材初回結果・復習テスト・漢字テスト・既存PDFを参照し、別repoへ根拠付き分析と学習資料を保存して、後続の学習結果を比較できるようにする。

優先順位は、学習事実の正確性と欠損防止、個人情報保護、既存Web運用への非干渉、構成と費用の小ささの順。

**利用範囲は単一家庭・単一生徒で固定する。複数家庭・複数生徒への対応や、そのための将来拡張は設計・実装範囲に含めない。** 家庭・生徒の管理モデル、対象選択、データ分離、所有者キー、移行処理は追加しない。認証とread-only権限制御は維持する。

```text
利用者が分析repoでCodexのPromptを手動実行
    |
    | HTTPS / MCP / OAuth access token
    v
既存API Gateway HTTP APIにMCP専用ルートを追加
    |
    v
新規MCP専用Lambda（read-only実行ロール）
    |
    v
Smart ExamのRead Services
    |
    +-- 既存Repository --> 既存DynamoDBテーブル/GSI
    +-- 既存S3のファイル参照 --> 短期署名GET URL

Codex --> PDFを必要時にローカル取得・閲覧
Codex --> 分析repoにrun・根拠・分析・資料を保存
```

認証は既存Cognito User Poolと新規MCP専用App Clientを使用する。MCPのためのAI推論サービス、イベント通知、Scheduler、Queue、分析DBは作らない。

### 配置リージョン

アップロード版の `.github/workflows/deploy-prod.yml:13-15` は `AWS_REGION: us-east-1` と `TF_VAR_region: us-east-1` を指定している。Terraform変数の既定値は東京でも、本番workflowは上書きする。

そのため本設計・料金は **米国東部（バージニア北部）us-east-1** を基準とする。実AWSの配置・請求書・実データ量は未確認。デプロイ前に実際の配置との一致を確認する。

## 2. 調査対象と現行コードから分かった制約

対象は `smart-exam-master-0907.zip`。ZIP commentは `89e2e8d105b6877ea45bfa3f13b9124a57733030`。この値と稼働中の本番コミットが同一かは未確認。

| 現行事実 | 設計への反映 | コード根拠 |
|---|---|---|
| 初回結果はMaterialQuestion.choiceのCORRECT/INCORRECT | 未設定は不明として保持。誤答に変換しない | `backend/src/types/db.ts:46-61` |
| MATERIALのquestionTextは問題番号相当 | 問題本文を取得できたと表示しない。元問題PDFを参照 | `backend/src/services/exam/getExam.ts:87-96` |
| MaterialQuestionに本人回答・点数・受験者正答率はない | 存在しない値を作らない。将来のPDF解析とは分離 | `backend/src/types/db.ts:46-61` |
| KANJIには問題文・答え・読み・下線範囲がある | それらをそのまま公開する | `backend/src/types/db.ts:66-83` |
| ExamとExamDetailの双方に正誤を保存する | 不一致を検出し、両方の原値を保持する | `backend/src/services/exam/submitExamResults.ts:14-24` |
| ExamHistoryにはexamId/isCorrectがない | 正誤履歴には使わず、復習キューの履歴として扱う | `backend/src/types/db.ts:158-175` |
| 試験完了時のHistoryは試験前CandidateのcorrectCountを保存する | Historyの回数から試験の正誤を逆算しない | `backend/src/services/exam/completeExam.ts:39-48` |
| 対象問題から試験を探すGSIが存在する | 問題別履歴のための新規GSIは不要 | `terraform/dynamodb.tf:167-193` |
| 既存の対象別試験ID取得はLimit:500、継続情報を公開しない | MCP用read処理にページングを追加する | `backend/src/repositories/examDetails/listExamIdsByTargetId.ts:8-19` |
| searchExamsは現状limit/cursorを実質処理しない | MCPで件数上限による欠損を防ぐ | `backend/src/services/exam/searchExams.ts:8-25` |
| API用mapperはregisteredDateがなければmaterialDateで補う | MCPはraw日付と出典を返す。初回実施日を補作しない | `backend/src/services/materials/materialMappers.ts:25-40` |
| submittedDateは採点処理で指定日または当日を保存する | 厳密な実施時刻として扱わない | `backend/src/services/exam/submitExamResults.ts:14-20` |
| テストPDF取得が生成・S3保存・DB更新を伴う場合がある | 当該ServiceをMCPから呼ばない | `backend/src/services/exam/getExamPdfUrl.ts:40-54` |
| 教材ファイル一覧は現状各種類1件を選択する | MCPは選択中と別版を区別し、取得可能なファイルを黙って捨てない | `backend/src/services/materials/listMaterialFiles.ts:117-136` |
| 現行主要テーブルにはstudentId/tenantId/ownerIdがない | 単一家庭・単一生徒の利用要件では追加不要。拡張課題や公開のblock要素にしない | `backend/src/types/db.ts:8-175` |
| 更新版番号・削除通知用の項目がない | updatedSinceによる完全差分取得を約束しない | `backend/src/types/db.ts:8-175` |

## 3. 実装境界

### Smart Exam repoが所有するもの

MCP transport、認証・認可、toolsの入出力schema、readサービス、既存DBモデルからの変換、取得元IDと品質情報、Terraform、接続テスト。

配置案:

```text
backend/src/mcp/                 # 新規: transport / tool definitions
backend/src/services/learningRead/  # 新規: 読取専用の集約・変換
backend/src/repositories/        # 既存: 必要なreadメソッドのみ拡張
backend/src/mcp/schema.ts        # 実装: input/output schema。追加workspaceは不要
backend/tests/mcp/               # SDK transport + AWS HTTP fixture契約テスト
terraform/                      # MCP Lambda / route / auth / IAM / logs
```

MCP adapterはRepositoryを直接組み合わせず、Read Servicesを呼ぶ。Read ServicesがRepositoryを利用する。既存REST ControllerをHTTP経由で呼び直さない。

Web APIと同一repoに置くが、Lambda・認証クライアント・実行ロールは分離する。既存Web向け型にある表示用fallbackを、学習証拠の型へそのまま持ち込まない。

### 分析repoが所有するもの

Prompt、分析基準、教材整理基準、観測結果の保存、差分比較、弱点の仮説、学習資料、実際の学習記録。MCPは弱点や習得度を判定しない。

## 4. MCP transport契約

| 項目 | v1案 |
|---|---|
| Codex側のサーバー名 | `smart_exam` |
| MCP endpoint | `https://api.smartexam.aws-handson.com/mcp/v1` |
| Transport | Streamable HTTP |
| 通常レスポンス | `application/json` |
| セッション | 永続セッションなし |
| 常駐SSE/サーバー通知 | 使用しない |
| 業務Contract version | `1.0.0` |
| 公開機能 | toolsのみ。PromptはGit repoに置く |
| Resources / Sampling / Elicitation / Subscriptions | v1では公開・使用しない |
| JSON schema | inputSchema / outputSchemaを定義し、実行前後に検証 |
| 未定義入力項目 | 拒否。入力objectは原則additionalProperties:false |

採用SDKは公式 npm `@modelcontextprotocol/sdk` **1.30.0**（完全固定、yarn.lockでintegrity固定）。インストール済みの `dist/esm/types.js` と `server/webStandardStreamableHttp` の実装を確認した。最新対応protocolは **2025-11-25**。SDKの対応リストは `2025-11-25 / 2025-06-18 / 2025-03-26 / 2024-11-05 / 2024-10-07` で、各版のinitializeを隔離transport試験で確認する。2026-07-28対応を公開しない。

`WebStandardStreamableHTTPServerTransport` の `sessionIdGenerator: undefined`、`enableJsonResponse: true` を採用。requestごとにserver/transportを作成・破棄し、initialize・JSON-RPC・protocol交渉はSDKに委ねる。独自の互換実装は追加しない。現行採用版には2026年案のMcp-Method/Mcp-Name必須化を移植しない。

一次資料: [公式SDK v1](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)、[固定npm package](https://www.npmjs.com/package/@modelcontextprotocol/sdk/v/1.30.0)、[採用transport仕様](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)。業務Contractは **1.0.0** のまま保持する。

### HTTPルート

| Route | 認証 | 動作 |
|---|---|---|
| `POST /mcp/v1` | MCP用JWT authorizer + read scope | MCP messageを処理 |
| `GET /.well-known/oauth-protected-resource/mcp/v1` | 不要 | OAuth Protected Resource Metadataを返す |
| `GET /mcp/v1` / `DELETE /mcp/v1` | 業務データを返さない | 非対応として405 |

既存の`$default`やWeb APIルートにMCP用tokenの受入れを追加しない。MCP metadataを無認証公開することと、学習データを無認証公開することは別。

### 実行制約（AWS制限ではなく本設計値）

- pageSize既定50、最大100。件数未満でもresponse上限に達すればcursorを返す。
- response本文は256KiBを目標上限とする。Codex側の出力切捨ても実機で検査し、必要ならpageSizeを下げる。
- 1処理の内部予算20秒、Lambda timeout25秒。HTTP APIのintegration上限30秒を超える設計にしない。[W6]
- 最初はMCP routeのrate 2 requests/sec、burst 5、Lambda reserved concurrency 2を目安に設定する。環境のquotaと実測で調整。
- rate制限・同時実行数制限は月額のハード上限ではない。
- 各requestで認証・認可する。家庭・生徒の識別による検索範囲の切替は行わない。

## 5. 認証・認可契約

### 5.1 採用方式

既存Cognito User Poolに **MCP専用public App Client** を追加し、Authorization Code + PKCE（S256）で利用者がログインする。Client Secret / client_credentials grantは使用しない。[W4]

```text
CodexがMCP metadataを取得
  -> Cognitoのdiscoveryから認証先を取得
  -> 利用者がブラウザでログイン
  -> Codexがcode + PKCE verifierをtokenへ交換
  -> MCP用access tokenでPOST /mcp/v1
```

| 設定 | 値/方針 |
|---|---|
| scope | `smart-exam-mcp/read` |
| OAuth resource | MCP endpointの完全URL |
| access token aud | MCP endpointの完全URL |
| 許可するclient_id | 新規MCP専用App Clientのみ |
| 許可する利用者 | 設定済みのCognito sub allowlist、または専用MCP_READERSグループ |
| token_use | accessのみ |
| Web/mobile既存クライアント | MCPに追加許可しない |
| MCP専用クライアント | Web REST authorizerのaudienceへ追加しない |

Cognitoはresourceパラメーターによってaccess tokenのaudを指定resourceに結び付けられる。API Gateway JWT authorizerでissuer、audience、scopeを検査し、Lambdaでclient_id、token_use、承認済み利用者を追加確認する。[W4][W5]

通常Web用tokenをMCPへ渡して済ませる方式、およびMCP bearer tokenを別audienceのREST APIへ転送する方式は採用しない。

API経由で新規clientを作る場合はmanaged-login brandingの適用も必要（[AWS API仕様](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateUserPoolClient.html)）。ActionsでMCP専用clientだけに既定styleを初期化する。既存Web/mobile clientやdomain設定は変更しない。

### 5.2 単一家庭・単一生徒の利用範囲

Smart Examの学習データは、今回の分析対象である単一生徒のデータとして扱う。複数家庭・複数生徒の混在検査、対象生徒の選択、家庭・生徒ごとの所有権モデルや検索filterは作らない。tenantId / householdId / studentId / learnerId等は、Tool入力・業務データ・run保存構造へ追加しない。

認証済みでMCPの利用を許可された利用者が、このSmart Examの学習データを読む。Cognitoの認証、MCP専用scope、許可した利用者の確認、IAMによるread-only権限制御は維持する。ログイン利用者IDを学習データの所有者キーにする変更は行わない。

本番・検証環境の取り違え防止には、接続endpointとenvironmentを記録する。これは接続環境の識別であり、家庭・生徒・データセットの選択機能ではない。所有者キーがないことを実装・公開の停止条件にしない。

### 5.3 Discovery

Protected Resource Metadata案:

```json
{
  "resource": "https://api.smartexam.aws-handson.com/mcp/v1",
  "authorization_servers": [
    "https://cognito-idp.us-east-1.amazonaws.com/<USER_POOL_ID>"
  ],
  "scopes_supported": ["smart-exam-mcp/read"],
  "bearer_methods_supported": ["header"]
}
```

MCPの認証discoveryと事前登録clientを利用する。[W2]
API Gateway自身が返す401に独自WWW-Authenticateを自由に付けられると仮定しない。well-known metadata経由でCodexがdiscoveryできることを受入試験で確認する。Lambdaが返す認証応答は必要に応じてscope/resource_metadataを示す。

### 5.4 Codex設定

以下はプレースホルダーを含む設定案。MCPサーバー実装後、端末のCodexで確定する。

```toml
[mcp_servers.smart_exam]
url = "https://api.smartexam.aws-handson.com/mcp/v1"
scopes = ["smart-exam-mcp/read"]
oauth_resource = "https://api.smartexam.aws-handson.com/mcp/v1"
startup_timeout_sec = 20
tool_timeout_sec = 30

[mcp_servers.smart_exam.oauth]
client_id = "<MCP_COGNITO_APP_CLIENT_ID>"
callback_port = 5555
callback_url = "http://localhost:5555/callback/<CODEXが示すサーバー固有ID>"
```

Codexは事前登録OAuth client_id、resource、callback URL/portの設定をサポートする。callbackにはサーバー固有IDが付く場合があるので、文字列を推測して登録せず、実際のCodexが使用する完全URLをCognitoへ登録する。[W3]

CognitoのHTTP redirect例外として文書化されているlocalhostを使い、URLとlistenerのportを一致させる。既定の127.0.0.1・可変portがそのままCognitoに通ると仮定しない。[W3][W4]

token/refresh tokenはCodexの資格情報ストアに置き、Git repo・Prompt・run・コマンド引数へ記録しない。App Client IDは秘密情報ではないが、利用者の認証情報とは明確に分ける。

### 5.5 IAM

MCP Lambdaに必要な学習データ権限は次に限定する。

- DynamoDB: 対象7テーブルと必要GSIに対するGetItem / BatchGetItem / Query / 必要なScan。
- S3: 指定bucketの許可prefix内のGetObject、prefix制約付きListBucket。VersionId利用時のみ必要なGetObjectVersionも検討する。
- CloudWatch Logs: MCP専用log groupへの必要なログ書込。

DynamoDBのPutItem / UpdateItem / DeleteItem / BatchWriteItem / TransactWriteItems、S3のPutObject / DeleteObject、Bedrock推論、他LambdaのInvokeは許可しない。ここでいうread-onlyは**学習データを変更しない**ことであり、監査ログ書込は別扱い。

Originが存在すればMCP用allowlistで検証する。CLI等のOriginなしは認証済みであれば許可する。既存API GatewayのCORSはAPI全体に作用するので、Webに影響する一括変更を避け、MCP入口のOrigin検証を必ず実施する。[W1]

## 6. 共通データ契約

### 6.1 識別子・種類

| 型 | 定義 |
|---|---|
| SubjectId | `1`:国語、`2`:理科、`3`:社会、`4`:算数。全てstring |
| ExamMode | 現行と同じ`MATERIAL` / `KANJI` |
| target | `{mode, targetId}`。MATERIALではquestionId、KANJIではwordId |
| assessment source | `INITIAL_MATERIAL` / `REVIEW_EXAM` / `KANJI_EXAM`。MCP上の区別であり既存ExamModeの追加ではない |
| entity ID | nativeのmaterialId / questionId / wordId / examIdを保持 |
| fileRef | MCPが返すopaque参照。任意のbucket/key/URLは入力させない |

科目対応の根拠: `packages/api-types/src/subject.ts:1-9`。

IDは既存値を変更しないopaqueな非空文字列とし、制御文字・不正な長さを拒否する。UUID形式を一律に仮定しない。dateRangeを指定する場合はfield/from/toを必須とし、暦として有効な日付とfrom <= toを検証する。

業務契約の破壊的変更はmajor versionを上げる。任意の出力項目の追加はminor versionで扱うが、既存enumの意味を変えない。将来のファイルrole等の拡張コードは未知値を保持できるstringとして契約化し、未知値を既知の別種へ読み替えない。

### 6.2 共通response

MCPのtools/call結果はstructuredContentへ構造化結果を入れる。互換用textを併記する場合も同じ内容から生成し、二つの内容を別々に作らない。[W7]

```json
{
  "contractVersion": "1.0.0",
  "environment": "<SERVER_ENVIRONMENT>",
  "serverVersion": "<BUILD_IDENTIFIER>",
  "requestId": "<REQUEST_ID>",
  "observedAt": "2026-09-07T15:00:00+09:00",
  "data": {},
  "pagination": {
    "nextCursor": null,
    "hasMore": false
  },
  "quality": {
    "consistency": "LIVE",
    "pointInTimeSnapshot": false,
    "warnings": [],
    "missingSources": []
  }
}
```

例中の値は仕様説明用であり実データではない。

serverVersionはActionsの同一commit SHAをesbuildでartifactへ埋め込む。Lambda環境変数だけを変更して旧codeを新版と表示しない。ローカルの未commit buildはlocal-uncommittedを明示する。observedAtは読取時刻であって、その日時時点のDBスナップショットを保証しない。

### 6.3 ResultObservation

| Field | Type | 意味 |
|---|---|---|
| evidenceId | string | 下記の安定した観測キー |
| sourceType | enum | 初回、復習試験、漢字試験の区別 |
| target | object | mode + targetId |
| materialId | string/null | 元教材。消失・不明ならnullと警告 |
| examId / seq | string/null, integer/null | 該当時のみ |
| subject | SubjectId/null | 元データにない場合は不明 |
| canonicalKey | string/null | 問題番号。問題本文とは別 |
| occurredOn | date/null | 元データが持つ結果に関連する日付 |
| dateSource | enum | MATERIAL_REGISTERED_DATE / EXAM_SUBMITTED_DATE / UNKNOWN |
| datePrecision | enum | DAY / UNKNOWN |
| materialDate / createdDate | date/null | 参考日付。実施日へ自動転用しない |
| finalizationStatus | enum | FINAL / PROVISIONAL |
| result | enum | CORRECT / INCORRECT / UNGRADED / CONFLICT |
| isCorrect | boolean/null | UNGRADED/CONFLICT時はnull |
| rawResults | object | choice / examResult / detailResult等の原値 |
| questionText | string/null | 本文が存在する場合だけ |
| correctAnswer | string/null | 登録された正答 |
| studentAnswer | string/null | 現行構造化データでは原則null |
| contentBasis | enum | CURRENT_MASTER / SOURCE_FILE / UNAVAILABLE |
| fileRefs | array | 関係する問題・解答・採点答案 |
| sourceRefs | array | entity種別/ID/seq/field等の取得根拠 |
| evidenceHash | string | 規則化した証拠内容のSHA-256 |

安定キー:

```text
初回: material:<materialId>:question:<questionId>:initial
試験: exam:<examId>:item:<seq>
```

同じ問題を同じ日に2回解いたものを、targetId+dateだけで1件へ統合しない。初回結果は現在のchoiceから観測したものであり、過去の変更履歴全てを復元できるわけではない。

evidenceHashは業務上の内容・元値・日付・参照元を含み、requestId、observedAt、署名URL、URL期限を除外する。objectキーを辞書順で規則化し、配列順と文字列は原値を保持する。objectのundefined項目を省略し、出力の不明値はnullとする。`fileRefs`は一時的な暗号化tokenなのでhashから除外し、元教材/試験のsourceRefsを含める。規則は契約テストで固定する。JSONの単なる表示順や読取時刻でhashが変わらないようにする。

### 6.4 正誤と確定状態

MaterialQuestion.choice未設定はUNGRADED。Exam.resultsとExamDetail.isCorrectの両方があり一致すれば採用、一方だけならそれを採用して保存先を明示、双方が異なればCONFLICTとして両方を保存する。

初回のisCompleted=false、またはExam.status=IN_PROGRESSの結果はPROVISIONAL。取得から除外せず、確定後の学習効果を評価する分母には自動採用しない。

Exam.resultsにだけ存在し対応する明細がない等の場合、SUMMARYの品質情報にUNMATCHED_RESULTを出す。ITEMSではsource-onlyの診断情報として保持し、seqを勝手に振って正式な解答イベントを捏造しない。

現在のmasterから得た正答・問題文を過去の試験時点の内容として表示しない。変更前の答案内容が保存されていない場合は、その限界をcontentBasisで表す。

### 6.5 日付

registeredDateがなければ初回実施日はUNKNOWN。materialDateは教材の日付として別に保持する。submittedDateは現在の採点処理が管理する日付なので、実際の受験時刻が記録されていると解釈しない。日単位しかない結果に任意の時刻を付けない。

同日の学習資料閲覧とテストの前後関係を時刻なしで断定しない。closedAtはキューの処理日時であり、受験日へ置換しない。

### 6.6 ページングと整合性

全てのcollectionにcursorとpageSizeを適用する。cursorはopaqueな継続位置であり認可の代替ではない。別tool・view・接続環境・検索条件へ持ち越したcursorは拒否し、各ページで同じ認可・filterを再適用する。

nextCursorがある限り、itemsが空でも続きがある。時間・件数予算に達したときに全件取得と偽装しない。SDK/Repository内の1MB制限や固定Limitで打ち切らない。[W8]

新規の日付GSIはv1では追加しない。Scanを使うsearchは全体の日付降順を保証せず、orderをUNSPECIFIEDと明示する。取得後にCodex側が日付・安定IDで並べる。件数や総数が全件走査未了で不明ならnullとし、ページ内件数と総数を混同しない。

既存GSIは結果整合性であり、APIをまたぐ同一時点のスナップショットは保証しない。[W9] 分析時には採点・編集との同時操作を避ける。収集中の変化・不整合を検出した対象は再取得し、解消しなければrunをINCOMPLETEにする。削除済みかつ過去snapshotにもない履歴は復元不能。

## 7. MCP Tool詳細

v1は7 tools。各toolにreadOnlyHint=true、destructiveHint=false、idempotentHint=trueを設定する。これらはクライアント向けの説明であり、権限制御はOAuth/IAMで別に強制する。[W7]

### 7.1 get_learning_context

入力: `{}`。

出力: environment、businessTimezone、subjects、contractVersion、serverVersion、対応するprotocol、capabilities、limitations。

capabilitiesにはexistingMaterialFiles、storedExamFiles、targetHistory、supplementalReports、changeTrackingの有無を示す。v1のsupplementalReports/changeTrackingをtrueと偽らない。家庭・生徒の選択や分離に関するcapabilityは設けない。

利用目的: 接続先を確認してから他toolを実行し、別環境のID・前回runとの混同を防ぐ。

### 7.2 search_materials

| 入力 | 型/既定値 |
|---|---|
| subject | SubjectId、省略時全科目 |
| provider / grade | string、任意 |
| isCompleted | boolean、任意。省略時両方 |
| dateRange | 任意のobject。field=materialDateまたはregisteredDate、from/toはYYYY-MM-DD・両端含む |
| dateRange.includeUndated | boolean、既定false。指定fieldが不明のものも含めるか |
| pageSize / cursor | 共通 |

出力items: materialId、title、subject、provider、grade、materialDate、raw registeredDate、isCompleted、宣言されたquestionCount、metadataHash。

重要: 定期全照合ではdateRangeを指定せず全ページ取得する。metadataHashが不変でも問題の正誤が不変とは限らない。

既存対応: `/api/materials/search`、materials Repository。ただし既存RESTのページング/fallbackに依存せず、MCP用のread処理で契約を満たす。

### 7.3 get_material

入力: materialId必須、view=`SUMMARY|QUESTIONS|FILES`（既定SUMMARY）、pageSize/cursor（collection viewのみ）。

| view | 出力 |
|---|---|
| SUMMARY | 教材metadata、原日付、完了状態、宣言件数、利用可能情報、整合性警告 |
| QUESTIONS | 全初回ResultObservation。正解・不正解・未採点を取得対象にする |
| FILES | 保存済みfileRef一覧。種類、元名、S3のLastModified/ETag等、現在選択中か、別版か |

現行API対応は教材詳細、questions、files。FILESは現在選択中のファイルだけでなく、認可された教材prefix内の別版も区別して取得可能にする。教材との対応関係が確認できないobjectを推測で教材に結び付けない。

MATERIALのquestionTextは本文未構造化ならnull。canonicalKeyをquestionTextとして返さない。questionTextを得るためのPDF読取はCodex側で行う。

### 7.4 search_exams

| 入力 | 型/既定値 |
|---|---|
| mode | MATERIAL/KANJI、任意 |
| subject | SubjectId、任意 |
| status | IN_PROGRESS/COMPLETED、任意。省略時両方 |
| dateRange | 任意。field=createdDateまたはsubmittedDate、from/toは日付・両端含む |
| dateRange.includeUndated | boolean、既定false |
| pageSize / cursor | 共通 |

出力items: examId、mode、subject、status、createdDate、submittedDate、宣言されたcount、metadataHash。

前回以降の日付だけでは、後日修正された古い試験・過去日付のimportを捕捉できない。定期全照合では日付を絞らない。

既存対応: `/api/exam/search`、exams.search Repository。v1の期間filterは利便用であり、更新feedではない。

### 7.5 get_exam

入力: examId必須、view=`SUMMARY|ITEMS|FILES`（既定SUMMARY）、pageSize/cursor（collection viewのみ）。

| view | 出力 |
|---|---|
| SUMMARY | 試験metadata、mode、status、createdDate、submittedDate、宣言件数、保存結果の不整合警告 |
| ITEMS | seqごとのResultObservation。MATERIALは元教材/問題参照、KANJIは本文・正答・読み・下線情報も返す |
| FILES | 保存済みの試験PDFのfileRef。生成前ならavailability=NOT_GENERATED |

summaryの点数や正答率を、正誤しかないデータから勝手に作らない。集計する場合は正解件数・採点済件数等として名前と分母を明示し、全ITEMS未取得の集計を試験全体と呼ばない。

`getExamPdfUrl`の生成処理は使用しない。FILES viewは既存pdfS3Keyまたは既存の決定的な試験キーとの対応を確認し、存在するobjectだけを公開する。存在しなければその状態を返して終了する。

### 7.6 get_target_learning_history

入力: mode、targetId必須。view=`RESULTS|REVIEW_STATE|LIFECYCLE`（既定RESULTS）。pageSize/cursor（collection viewのみ）。

| view | 出力 |
|---|---|
| RESULTS | 初回結果（MATERIALのみ）と該当するExamDetail/Exam.resultsの履歴。各回を独立したResultObservationとして返す |
| REVIEW_STATE | 現在の候補状態とその根拠。下記参照 |
| LIFECYCLE | ExamHistory等のキュー履歴。試験結果ではないことを型で示す |

RESULTSは既存`gsi_target_id_exam_id`から関連試験を探し、modeも照合する。GSIの並びは受験日順ではないので、全ページ取得後に日付順へ並べる。親試験・問題masterが欠落しても残っている明細を黙って捨てず、MISSING_PARENT/MISSING_TARGETを記録する。

Exam.resultsにしか存在せずGSIから見つからない孤立結果は、このtarget-queryだけで完全発見を保証できない。全試験のITEMS照合で検出し、分析repoのinventory/evidenceにも不整合として保存する。

REVIEW_STATE案:

```json
{
  "target": {"mode": "MATERIAL", "targetId": "<QUESTION_ID>"},
  "state": "OPEN",
  "correctCount": 1,
  "nextTime": "<YYYY-MM-DD>",
  "lockedByExamId": null,
  "sourceRefs": [{"entityType": "EXAM_CANDIDATE", "entityId": "<ID>"}],
  "masteryAssessment": "NOT_PROVIDED"
}
```

stateはOPEN / LOCKED / EXCLUDED / NO_ACTIVE_CANDIDATE / INCONSISTENT。

- active候補が一意ならそのstatus/count/dateを採用。
- 矛盾した複数active候補があればINCONSISTENT。
- activeがなく最新の関連終了履歴が明示的なEXCLUDEDなら、その根拠付きでEXCLUDED。
- activeがないだけならNO_ACTIVE_CANDIDATE。習得済みとはしない。
- 該当するauthoritative recordがないcount/dateはnull。

LIFECYCLEのcorrectCountはraw値として返すが、生成経路により意味が異なることを示す。isCorrectや受験日を逆算しない。import履歴がLifecycleにしかない場合、履歴があることと試験別の正誤を復元できることを分ける。

### 7.7 get_file_access

入力: fileRef必須。他のURL/bucket/key指定は不可。

出力: fileRef、ownerRef、役割、fileName、contentType、sizeBytes、lastModified、etag、versionId（実在時のみ）、url、expiresAt、downloadMethod=GET。

ownerRefはファイルが属する教材・試験等への参照であり、家庭・生徒・ログイン利用者の所有権モデルではない。元教材・試験との対応を保持するため、この参照は残す。

署名URL有効期間は発行時から300秒を既定とする。fileRefから教材・試験との対応関係と読取権限を再確認して発行する。期限切れ後は再取得する。ファイル変更を検出したら最新metadataを再確認し、過去版のまま読んだと扱わない。

PDFはMCP responseにbase64で埋め込まない。Lambdaで抽出・OCR・要約・生成しない。CodexはURLからローカルへ取得してPDFの文字・図表・答案を確認する。URLを受け取れたことだけで読取完了としてはならない。

署名URLはBearer credentialと同じく秘密として扱う。Git・analysis.md・evidence・通常ログに保存しない。schema上の一時URLは呼出し直後のダウンロードにのみ使い、永続保存前にallowlist方式で取り除く。

S3のETagをSHA-256と呼ばない。ローカルでダウンロードしたbytesのSHA-256を計算してsource-files manifestへ保存する。実際のS3 VersionIdがない場合に過去objectを再取得できると保証しない。

## 8. エラー・部分取得

HTTP/JWT層では401（未認証/無効token）、403（権限不足）、429（過剰呼出し）、必要な5xxを返す。JSON-RPCの構文・未対応method・protocol versionは採用SDKの仕様に従う。

tool業務エラーはisError=trueとして、code、message、retryable、requestIdを返す。

| Code | 意味 | 再試行 |
|---|---|---|
| NOT_FOUND | 認可された範囲に指定対象が存在しない | 通常しない |
| INVALID_CURSOR | tool/view/filter/environmentとcursor不一致、または不正 | 先頭から再取得 |
| FILE_NOT_GENERATED | 対応PDFが保存されていない | 自動生成しない |
| FILE_CHANGED | 参照後にファイルが更新された | metadataを再取得 |
| FEATURE_UNAVAILABLE | 例: 未実装の成績資料機能 | 今回は利用しない |
| UPSTREAM_UNAVAILABLE | DynamoDB/S3等の一時障害 | 上限付き再試行 |
| RESPONSE_TOO_LARGE | 最小の分割でも応答上限を超える | 範囲縮小。欠損扱いを記録 |

採点不一致・master欠落などは原則該当recordのqualityへ記録し、正常な他recordも返す。全tool失敗と問題ごとの不整合を混同しない。正常responseでも未取得部分があればrunを完了扱いにしない。

リトライは間隔を増やして最大3回を初期値とし、認証・権限エラーを無限再試行しない。続行不能なら取得済み根拠と未取得一覧を保存して停止する。

## 9. 分析repoと学習効果評価

### 9.1 データ取得は全照合、AIの再分析は差分

現行DBでは全体の更新versionやtombstoneがないため、初期は次の方式を採る。

```text
前回の成功runを読む
    -> 全教材/全試験のinventoryをページング取得
    -> 各教材QUESTIONS / 各試験ITEMSを取得
    -> evidenceIdとevidenceHashで前回と照合
    -> NEW / CORRECTED / UNCHANGED / SOURCE_MISSINGを区別
    -> 新規・訂正・未解決項目を中心に分析
    -> 必要な元PDF・対象別履歴・現在の復習状態を追加取得
    -> 新規runを保存
```

metadataが不変でも問題の結果が変わる可能性があるので、metadataHashだけで詳細取得をskipしない。PDF bytesは変更と分析必要性があるものだけ再取得する。

データ量が増えた際にのみupdatedAt/revision/tombstone等の正式な変更feedを別途設計する。最初からイベント基盤を導入する理由にはしない。

### 9.2 保存構成

```text
analysis-repo/
  AGENTS.md
  prompts/
  policies/
  templates/
  runs/
    2026-09-07T150000+0900_<suffix>/
      manifest.yaml
      inventory.json
      evidence.jsonl
      source-files.json
      gaps.yaml
      analysis.md
      progress.md
      materials/
        index.yaml
        ...
  study-log/
    2026-09-08_<entry-id>.yaml
  .gitignore
```

過去runは完成後に上書きしない。失敗・中断runもstatusと未完了範囲を保持する。後日判明した訂正は次runまたは訂正記録として追記する。analysis-repoは個人成績を含むためprivate、限定共有とする。

manifest必須項目:

| 項目 | 意味 |
|---|---|
| runId / previousRunId | runの対応関係 |
| analyzedAt | 分析日時 |
| collectionStartedAt / collectionEndedAt | データ取得区間 |
| comparisonPolicy | 全照合であること、対象科目・教材・試験の範囲 |
| environment / endpoint | 本番・検証環境等の接続先の取り違え防止。家庭・生徒の選択には使わない |
| contractVersion / protocolVersion / serverVersion | 実際の接続版 |
| promptPath / promptGitCommit / promptContentHash | 実行Promptの版。未commit差分も識別 |
| actualModelId | 実際に取得できる識別子。取得不能ならunknown |
| status | COMPLETE / INCOMPLETE / FAILED |
| coverage | inventory件数、取得済件数、未取得ID、警告 |

COMPLETEは要求した範囲の「現存する取得対象」の全件取得を確認したことを意味し、削除済み全履歴の復元や厳密な同時点snapshotの保証ではない。

### 9.3 資料の生成と実際の学習を分離

materials/index.yamlにはmaterialId、generatedAt、versionHash、path、対応gapIds、作成根拠を保存する。

実際の学習は別の追記式study-logに、studyEventId、studiedOn、materialId、materialVersionHash、記録者、任意の所要時間・メモを保存する。資料を生成しただけでstudiedOnを埋めない。過去runに後からstudied_atを書き込まない。

### 9.4 比較で判定するもの

同じ問題の再正解、時間を空けた再正解、関連する別問題への対応を区別する。件数・対象問題・間隔を併記し、少数の成功を全単元の習得へ拡大しない。

未受験・新規証拠なし・日付不明は「効果なし」ではなく評価不能。復習キューからのEXCLUDEDも習得の証明ではない。

studiedOnがあっても、塾等の別学習を統制していない以上「当該資料が改善を引き起こした」と断定しない。「学習後に観測された変化」として報告する。誤答だけを分母にせず、取得範囲内の正解・未採点も保有する。

## 10. PDF拡張の扱い

今回は既存のQUESTION / ANSWER / GRADED_ANSWERと保存済みEXAM_PAPERを対象とする。成績票・学校判定資料の登録機能は別タスク。

将来は既存fileRef/ownerRefの仕組みに、SCORE_REPORT / SCHOOL_REPORT / ERRATA等の役割情報を拡張する。一つのPDFが複数役割を持つ場合は複数rolesとページ範囲で表し、ファイル名だけから排他的に分類しない。

PDFが0件なら正常。補助資料なしで実行可能な範囲を明示する。数字・問題本文・本人回答が取れない場合の制限を「AIが補って解析成功」に置き換えない。

## 11. AWSサービスと料金

### 11.1 採用サービス

| サービス | 新規/再利用 | 用途 |
|---|---|---|
| API Gateway HTTP API | 既存にルート/authorizer/integration追加 | MCPのHTTPS入口 |
| Lambda | MCP用を1関数追加 | MCPプロトコル処理とreadサービス |
| Cognito | 既存pool + 専用App Client/scope | 利用者ログイン、MCP用token |
| DynamoDB | 既存7テーブル/GSI再利用 | 教材・問題・試験・正誤・復習状態 |
| S3 | 既存bucket再利用 | 既存PDFと署名GET |
| IAM | 専用実行role追加 | 学習データ書込を許可しない |
| CloudWatch Logs | 専用log group追加 | 呼出し数、時間、失敗、消費量 |
| CloudWatch Alarm | 任意。例では1メトリクス | エラー率等の監視 |
| 既存custom domain/ACM/DNS | 再利用 | 新規domain・hosted zoneなし |

作らないもの: MCP用のEC2、ECS、ALB、NAT Gateway、VPC、Provisioned Concurrency、EventBridge、SQS、Step Functions、AI用DB、Bedrock推論処理。既存Smart Examの答案解析機能の費用は別。

### 11.2 単価

2026-09-07調査、us-east-1、USD、税・為替・契約割引を含めない。無料枠は既存利用と共有されるので、基本試算では控除しない。

| 項目 | 試算単価 | 根拠 |
|---|---:|---|
| HTTP API request | $1.00 / 100万回（最初の料金帯） | [W10] |
| Lambda request | $0.20 / 100万回 | [W11] |
| Lambda x86 compute | $0.0000166667 / GB秒 | [W11] |
| DynamoDB Standard on-demand read | $0.125 / 100万RRU | [W12] |
| S3 Standard GET等 | $0.0004 / 1,000回 | [W13] |
| S3 Standard LIST | $0.005 / 1,000回 | [W13] |
| S3 Standard storage | $0.023 / GB月（最初の料金帯） | [W13] |
| CloudWatch Logs取込 | $0.50 / GB | [W14] |
| CloudWatch Logs保存 | $0.03 / GB月 | [W14] |
| 標準CloudWatch Alarm | $0.10 / 1メトリクス月 | [W14] |
| インターネット転送 | $0.09 / GBを課金ケースとして計上 | [W10][W15] |

RRUは「MCP呼出し1回」「Query API1回」と同じではない。itemサイズ、読取方式、走査範囲に依存する。Filterで返却件数が少なくても走査コストが小さいとは限らない。[W8][W12]

Cognitoは既存利用者が同じpoolを利用する想定で追加MAUを0と置く。実際のpoolの料金tierは未確認。Essentialsの直接/social loginは月10,000 MAUの無料枠、その後の該当料金は$0.015/MAU。SMS/MFA/メール等の追加機能費用はこの試算に含めない。[W16]

### 11.3 月4回の手動分析の例

これは実測ではなく計算用の仮定。分析4回とはAPI4回ではない。

| 利用量 | 仮定 |
|---|---:|
| MCP/metadata等HTTP request合計 | 4,000回/月 |
| Lambda memory | 512MB、x86 |
| Lambda平均課金時間 | 0.5秒/request |
| DynamoDB read | 400,000 RRU/月 |
| S3 GET/HEAD等 | 2,000回/月 |
| S3 LIST | 200回/月 |
| Logs取込・平均保存 | それぞれ0.1GB |
| インターネット転送合計 | 1GB/月 |
| Alarm | 標準1メトリクス |
| 学習データ新規保存 | 0GB。元データ・PDFを再利用 |

| 項目 | 計算 | 月額 |
|---|---|---:|
| HTTP API | 4,000 / 1,000,000 × 1 | $0.0040 |
| Lambda request | 4,000 / 1,000,000 × 0.20 | $0.0008 |
| Lambda compute | 4,000 × 0.5GB × 0.5秒 × 0.0000166667 | $0.0167 |
| DynamoDB | 400,000 / 1,000,000 × 0.125 | $0.0500 |
| S3 GET等 | 2,000 / 1,000 × 0.0004 | $0.0008 |
| S3 LIST | 200 / 1,000 × 0.005 | $0.0010 |
| Logs | 0.1 × 0.50 + 0.1 × 0.03 | $0.0530 |
| Alarm | 1 × 0.10 | $0.1000 |
| 転送 | 1 × 0.09 | $0.0900 |
| 合計 | 丸め前約0.3163 | **約$0.32/月** |

インターネット転送のAWS共通無料枠100GB/月に空きがあれば、この例の$0.09は不要。その場合約$0.23/月。Lambda等の無料枠も利用状況次第だが、無料を前提に運用費0と約束しない。[W11][W15]

初期の運用予算は **$1〜3/月程度** を目安とする。ただし上限保証ではない。全走査・大量PDF・リトライが増えれば超える。Codex側の契約・モデル利用費、既存Smart Exam全体の運用費、Gitサービス料金、税、将来の成績PDF解析費は別。

将来S3にStandardのPDFを追加で1GB保存する場合は、保存分だけなら約$0.023/月を加える。追加GET・転送・解析があれば別途加算。

### 11.4 代替: AgentCore Gateway

AgentCore GatewayをMCPのmanaged入口にしてLambdaへ接続する案も成立する。Gatewayの公開単価は$0.005/1,000 invocationsなので、4,000回ならGateway分$0.02/月。Lambda/DB/S3等は別。[W17]

小規模では費用差は小さい。独自にMCP transportの対応を管理したくないなら再検討価値がある。一方、現行サービスの再利用、専用Cognito認可、履歴の複雑な品質情報を一つのrepoでテストする構成として、今回はHTTP API + Lambdaを採用案とする。Gatewayを採る場合は代替の入口とし、目的なく両方のGatewayを直列に増やさない。

## 12. ログと費用監視

ログ項目はrequestId、tool名、認可結果、取得件数、response bytes、elapsed time、DynamoDB consumed capacity、S3 request count、error codeを基本とする。氏名・答案・成績本文・token・署名URL・PDFを通常ログに出さない。

Logs retentionは30日を初期案とする。メトリクスの無制限増加を避け、questionId/examIdごとの高cardinalityカスタムメトリクスは作らない。利用者識別が監査上必要なら限定した識別子/不可逆化した値を扱う。

分析の効果記録はCloudWatchではなく分析repoが所有する。監視AlarmはAI分析を起動するイベントではない。

## 13. 受入試験と停止条件

| 分類 | 最小確認 | 合格条件 |
|---|---|---|
| 接続 | 利用するMacのCodexでlogin / tools/list / context | OAuthと採用protocolが実機で成功 |
| Discovery | tokenなしの401からwell-knownを発見 | 正しいCognitoへ誘導、学習データは漏れない |
| 権限 | 未承認sub、Web token、scope不足、異なるaud/client | 全て拒否 |
| 逆方向の権限 | MCP tokenで既存更新APIを呼ぶ | authorizerで拒否 |
| IAM | 読取Lambda roleでDB/S3の書込を試験用resourceに試す | AccessDenied |
| 初回と復習 | 1教材 + 複数回MATERIAL試験 | 元結果と日付・各回ID・正誤が一致 |
| 漢字 | 1KANJI試験と再試験 | 本文・読み・下線・結果を保持 |
| 全件取得 | 1MB超/500件超/空ページにcursorあり | 全ページ後に件数・ID集合が一致、無言の欠損0 |
| 出力制限 | 大きなtool結果 | Codexの出力切捨てを検出。ページ縮小で完全取得 |
| 日付 | registeredDate/submittedDateなし | 実施日を補作しない |
| 採点競合 | ExamとDetailの不一致 | 原値とCONFLICTが残る |
| 削除・孤立 | masterや親試験の欠落、結果のみ残存 | 残存証拠を捨てず不足を明示 |
| 復習状態 | OPEN/LOCKED/EXCLUDED/候補なし | キュー状態と習得判定を分離 |
| 既存PDF | 問題・解答・採点答案をdownload | 実ファイルを開いてページを確認、hashを保存 |
| 未生成PDF | MATERIALの試験PDFなし | 生成・S3 PUT・DB更新0 |
| 過去訂正 | 第1run後に古い試験を訂正 | 第2runでCORRECTEDとして検出 |
| backdated追加 | 古い日付の試験を後日追加 | NEWとして検出 |
| 前回以降の評価 | study-logと後続結果 | 未学習/同日順序不明/証拠なしを誤判定しない |
| 永続情報 | repoとlogの検査 | tokenと署名URLの永続保存0 |
| 非干渉 | 既存WebとiOSの主要read/write | MCP追加前と同じ動作 |

今回のサーバー実装では実機Codex接続を停止条件にしない。デプロイ工程の停止条件は、必須callback等の未設定、破壊的/無関係なplan、既存承認の不足。データ検証の停止条件は、ページングで欠損する、読取で業務データを書き換える、採点不一致を隠す、元PDFが必要なのに取得できないのに完全分析と表示する場合。

## 14. 段階的な実装順

1. 7 Tools、readサービス、schemaを実装し、SDKクライアントと隔離AWS HTTP fixtureで正常系・異常系を検証する。
2. 専用Cognito client/scope・MCP Lambda・IAM・ルートを実装し、Actionsでfmt/init/validate/plan/applyを行う。ローカルでTerraformは実行しない。
3. 同一commit artifactをデプロイしてmetadata・未認証拒否・Lambdaアプリ/build・IAM policy simulationを検証する。
4. 既存の安全な試験tokenがある場合だけ認証済みHTTPSを確認する。未準備なら未検証として記録し、設定を緩めない。

任意の成績PDF登録は上記と切り離した後続タスク。各段階は設計合意後に実施し、本書の作成だけでは実装開始・本番反映を意味しない。

## 15. 外部一次資料

料金・製品仕様の確認日: 2026-09-07。URLは参照資料であり、この設計案のendpointが稼働済みであることを意味しない。

- [W1] MCP Streamable HTTP 2025-11-25: `https://modelcontextprotocol.io/specification/2025-11-25/basic/transports`
- [W2] MCP Authorization: `https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization`
- [W3] OpenAI Codex MCP / configuration: `https://developers.openai.com/codex/mcp` / `https://developers.openai.com/codex/config-reference`
- [W4] Cognito authorization endpoint / resource binding / PKCE: `https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html`
- [W5] HTTP API JWT authorizer: `https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html`
- [W6] HTTP API quotas: `https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-quotas.html`
- [W7] MCP tools: `https://modelcontextprotocol.io/specification/2025-11-25/server/tools`
- [W8] DynamoDB Query / pagination: `https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html` / `https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html`
- [W9] DynamoDB read consistency: `https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html`
- [W10] API Gateway pricing: `https://aws.amazon.com/api-gateway/pricing/`
- [W11] Lambda pricing: `https://aws.amazon.com/lambda/pricing/`
- [W12] DynamoDB pricing: `https://aws.amazon.com/dynamodb/pricing/`
- [W13] S3 pricing: `https://aws.amazon.com/s3/pricing/`
- [W14] CloudWatch pricing: `https://aws.amazon.com/cloudwatch/pricing/`
- [W15] AWS Global Network FAQ / internet transfer allowance: `https://aws.amazon.com/about-aws/global-infrastructure/global-network/faqs/`
- [W16] Cognito pricing: `https://aws.amazon.com/cognito/pricing/`
- [W17] AgentCore Gateway / pricing: `https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html` / `https://aws.amazon.com/bedrock/agentcore/pricing/`
