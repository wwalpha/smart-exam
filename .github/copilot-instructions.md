# コーディング規約

## その他
- AWS CLI を利用する際は常に `--no-cli-pager` オプションを付与してください。

## Terraform

### 1. 一般
- 変更をコミットする前に必ず `terraform fmt` を実行してください。
- [Standard Module Structure](https://developer.hashicorp.com/terraform/language/modules/develop/structure) に従ってください。
- `terraform validate` を使用して構文エラーをチェックしてください。
- `terraform apply` を実行してエラーが発生した場合は、エラーが解消するまで対応を継続してください。

### 2. 命名規則
- すべてのリソース名、データソース、変数、出力には `snake_case` を使用してください。
- リソース名にリソースタイプを繰り返さないでください（例: `resource "aws_route_table" "public_route_table"` は避け、`resource "aws_route_table" "public"` としてください）。
- 変数名は値を説明するものにしてください（例: `region`, `instance_type`）。

### 3. ファイル構造
- 原則として、サービス（責務）ごとにファイルを分割してください（巨大な `main.tf` に集約しない）。
- 例: `cognito.tf`, `s3.tf`, `dynamodb.tf`, `iam.tf`, `lambda.tf`, `apigw.tf`, `data.tf`
- `main.tf` を使う場合でも、最小限（薄い集約/説明）に留めてください。
- `variables.tf`: 入力変数の定義。
- `outputs.tf`: 出力値の定義。
- `versions.tf`: Terraform とプロバイダーのバージョン制約。
- `providers.tf`: プロバイダーの設定。
- `backend.tf`: バックエンドの設定（State ロック用の S3 + DynamoDB）。

### 4. 変数と出力
- 変数と出力には必ず `description` を含めてください。
- 変数には必ず `type` を指定してください。
- `default` 値は、適切なデフォルト値が存在する場合にのみ使用してください。

### 5. リソース設定
- 明示的な依存関係（`depends_on`）は必要な場合にのみ使用し、補間による暗黙的な依存関係を利用してください。

### 6. セキュリティ
- シークレットや認証情報を git にコミットしないでください。環境変数やシークレットマネージャーを使用してください。
- State 保存用の S3 バケットは暗号化し、プライベートに設定してください。

### 7. コメント
- すべてのリソース定義・データソース定義・変数定義（`variables.tf`）・出力定義（`outputs.tf`）の直上に、以下の形式でコメントブロックを必ず追加してください：
  ```
  # ----------------------------------------------------------------------------------------------
  # <リソースの説明>
  # ----------------------------------------------------------------------------------------------
  ```

- ファイル先頭に1つだけコメントを書いて複数ブロックをまとめるのはNGです（`resource` / `data` / `variable` / `output` ごとに必ず1つ）。

## React (Frontend)

### 1. 一般・コンポーネント
- ES6 モジュール構文 + TypeScript を必須とします。
- 関数コンポーネント（Functional Components）を使用してください。
- コンポーネント名とファイル名には `PascalCase` を使用してください（例: `MyComponent.tsx`）。
- コンポーネントは単一責任の原則に従い、1 コンポーネント=1 機能を目指してください。
- コンポーネント間のデータ受け渡しは props または Zustand ストアを利用してください。
- JSX 内のロジックは最小限にし、複雑な処理はコンポーネント外の関数へ切り出してください。
- エクスポートは名前付きエクスポート（Named Export）を推奨します。

### 2. TypeScript
- すべてのファイルで TypeScript を使用してください。
- `any` 型の使用は避け、適切な型定義を行ってください。
- 型定義は `frontend/typings` ディレクトリへ集約してください。
- `frontend/src` 配下の import は相対パス（`./`, `../`）を使用せず、alias import を使用してください（例: `@/...`, `@typings/...`）。

### 3. スタイリング & UI
- UI コンポーネントライブラリとして **shadcn/ui** を使用してください。
- スタイリングには **Tailwind CSS** または **CSS Modules** を使用し、インラインスタイルは避けてください。

### 4. 状態管理 & API
- グローバルな状態管理には **Zustand** を使用してください。
- Zustand store は slice 方式で実装してください（例: `createXxxSlice` を定義し、`create()` で結合する）。
- API 呼び出しは Zustand 側に集約し、コンポーネントから直接呼び出さないでください。
- API の Request / Response 型は、たとえ空であっても必ずペアで定義してください。
- Zustand ストアは `frontend/src/stores` ディレクトリへ集約してください。
- store の `create()` による定義は `frontend/src/stores/index.ts` に集約し、各画面/機能は `@/stores` から import してください。

### 4.1 型定義
- store が扱う state / action / 戻り値の型は省略せず、正しく型を定義してください（戻り値の型も明示）。

### 4.2 ES Modules（書き方統一）
- `frontend/src` 配下は default export を使わず、named export で統一してください。
- 型の import は `import type` を使用してください。

### 5. ディレクトリ構造 & ユーティリティ
- 画面（ルーティング単位）は `frontend/src/pages` 配下へ配置してください（例: `src/pages/auth`, `src/pages/exam`）。
- Custom Hook は `frontend/src/hooks` 配下に集約し、必要に応じて機能（責務）ごとにサブフォルダを切ってください（例: `src/hooks/wordtest`）。
- 共通コンポーネントは `src/components/ui` (shadcn/ui) または `src/components/common` に配置してください。
- utility 関数は `src/utils` のフォルダに集約してください。
- 変換やフォーマット処理は `src/utils` 配下の共通関数へ切り出し、各コンポーネントから再利用してください。

#### 5.1 フォルダ構造（再発防止）
- `frontend/src/pages`: 画面（ルーティング単位）
- `frontend/src/hooks`: UI から切り出したロジック（Custom Hook）
- `frontend/src/stores`: Zustand store（slice）
- `frontend/src/services`: API クライアント/サービス層（HTTP 呼び出し）
- `frontend/src/mocks`: API mock（MSW など）
- `frontend/src/components`: 共通 UI
- `frontend/typings`: 型定義（Request/Response、Slice 型など）

### 6. フック (Hooks)
- React Hooks のルール（トップレベルでの呼び出しなど）を厳守してください。
- Custom Hook を積極的に活用し、ロジックの再利用性を高めてください。
- カスタムフックの名前は `use` で始めてください。

### 7. コメント
- 日本語コメントは対象のソースコード行の直上に記載してください（行末コメントは避けてください）。
- `import` 文に対してはコメントを付与しないでください。

#### 7.0 行レベルコメント（再発防止）
- 非自明な分岐・副作用・ワークアラウンド（例: `useEffect` の多重実行防止、API の制約回避）には、対象行の直上に 1 行の日本語コメントを付与してください。
- 原則として「何をしているか」ではなく「なぜ必要か」を説明してください。

#### 7.1 適用範囲（再発防止）
- このコメントルールは `frontend/src` 配下の手書きコードに適用します。
- `frontend/dist` などの自動生成ファイル（ビルド成果物）は編集・整形・コメント修正の対象外です。

#### 7.2 書き方（再発防止）
- 原則として「コードで意図が伝わる」状態を優先し、不要なコメントは書かないでください。
- コメントが必要な場合は `//` の日本語コメントを「対象行の直上」に 1 行で付けてください。
- 行末コメント（例: `const x = 1 // ...`）は禁止です。

### 8. ストアと型定義
- Zustand Slice の型定義（`XxxSlice`）は `frontend/typings` ディレクトリに配置してください（`src` 配下に置かない）。
- コンポーネントから直接 `useStore` を呼び出してロジックを書くのではなく、カスタムフック（`useXxx`）を作成してロジックを分離してください。

## Backend (Node.js)

### 1. 言語・環境
- すべてのファイルで **TypeScript** を使用してください。
- ES Modules (`import` / `export`) を使用してください。
- 非同期処理には `async` / `await` を使用し、Promise チェーンは避けてください。

### 1.1 型定義
- 型定義は `backend/typings` ディレクトリへ集約してください。

### 2. アーキテクチャ (Lambda)
- ハンドラー関数は薄く保ち、ビジネスロジックは Service 層や UseCase 層に分離してください。
- 責務の分離（Separation of Concerns）を意識し、コードの再利用性とテスト容易性を高めてください。

### 3. エラーハンドリング
- 適切な HTTP ステータスコードを返してください。
- エラーログは構造化ログ（JSON形式など）で出力してください。
- `try-catch` ブロックを使用して例外を適切に捕捉し、エラーレスポンスを統一してください。

### 4. データベース (DynamoDB)
- **AWS SDK v3** を使用してください。
- データアクセスロジックは Repository 層などの専用モジュールに集約してください。
- 型定義を活用し、DynamoDB のアイテムと TypeScript の型を一致させてください。

### 5. テスト
- 単体テストを作成し、ビジネスロジックを検証してください。
- テストフレームワークには **Vitest** または **Jest** を使用してください。

### 6. API URI 設計
- API URI（パス設計）はベストプラクティス（RESTの原則）を優先してください。
- パスはリソース（名詞）を表現し、動詞を含めないでください（操作はHTTPメソッドで表現）。
- リソース名は複数形を基本とし、親子関係が明確な場合のみ階層化してください。
- フィルタ/ソート/ページング等は原則クエリパラメータで表現してください。
- バージョニングはパス先頭で統一してください（例: `/v1/...`）。
- パスやパラメータ命名はプロジェクト内で一貫させてください（既存のAPI定義と揃える）。
- パス/クエリ/パスパラメータ名はすべて小文字で定義してください。
- パスにはハイフン（`-`）やアンダースコア（`_`）を使用しないでください。
