# 技術スタック詳細

## Frontend
- **Core**: React + Vite
    - 高速なHMRと軽量なビルド環境を提供
- **UI Components**: shadcn/ui
    - モダンでカスタマイズ可能なUIコンポーネント
- **State Management**: Zustand
    - シンプルで軽量な状態管理
- **主な機能**:
    - 科目別フィルタリング
    - 試験実施・解答インターフェース
    - 解答用紙の作成・印刷機能
    - 採点済み用紙のアップロードと結果確認

## Backend
- **Runtime**: Node.js
- **Compute**: AWS Lambda
    - サーバーレスアーキテクチャによるイベント駆動処理
- **Database**: Amazon DynamoDB
    - 正誤結果、学習履歴などのデータ保管
- **Storage**: Amazon S3
    - 問題用紙、解答ファイル、アップロードされた画像の保管
- **AI Service**: Amazon Bedrock / OpenAI / Google
    - 採点済み回答用紙の画像解析 (Claude 3, GPT-4o, Gemini 等)
    - 解説生成による学習支援

## Infrastructure (Terraform)
- **IaC Tool**: Terraform
- **Cloud Provider**: AWS
- **管理リソース**:
    - AWS Lambda (Function, Layer)
    - Amazon DynamoDB (Table, Index)
    - Amazon S3 (Bucket, Policy)
    - Amazon Bedrock (IAM Policy)
    - IAM (Role, Policy)
    - API Gateway (Frontendとの通信用)

## CI/CD
- **Platform**: GitHub Actions
    - 自動テスト、ビルド、デプロイパイプライン
