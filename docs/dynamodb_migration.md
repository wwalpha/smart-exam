# DynamoDB マイグレーション手順（AWS CLI）

このドキュメントは、既存 DynamoDB データを新しいスキーマに合わせるための **AWS CLI ベースの移行手順**です。

対象変更:
- Materials: `executionDate` → `materialDate`（必須）にリネーム
- Materials: `category` 属性を削除
- Materials: `grade` / `provider` を必須化
- ReviewTests: 埋め込み items の `materialExecutionDate` → `materialDate` にリネーム
- ReviewTestCandidates: `questionKey` 属性を削除（GSI も差し替え）

> 重要: 大量データの場合、`scan` + 逐次 `update-item/put-item` は時間がかかり、RCU/WCU も消費します。必要なら一時的にスループットを上げる、夜間に止めて実施する、など運用設計をしてください。

## 前提

- AWS CLI v2
- `jq`
- 実行環境に適切な AWS 認証情報（`AWS_PROFILE` など）
- すべての AWS CLI コマンドに `--no-cli-pager` を付与すること

## 環境変数（テーブル名）

backend の既定値（[backend/src/lib/env.ts](../backend/src/lib/env.ts)）:

```bash
export AWS_REGION=ap-northeast-1
export TABLE_MATERIALS=materials
export TABLE_REVIEW_TESTS=review_tests
export TABLE_REVIEW_TEST_CANDIDATES=review_test_candidates
```

必要に応じて実環境に合わせて上書きしてください。

## 1) バックアップ（必須）

### Materials

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_MATERIALS" \
  --output json > materials.backup.json
```

### ReviewTests

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_REVIEW_TESTS" \
  --output json > review_tests.backup.json
```

## 2) Materials: `executionDate` → `materialDate`、`category` 削除

### 2-1. まず「変換対象」を一覧

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_MATERIALS" \
  --projection-expression "materialId, executionDate, materialDate, category" \
  --output json \
| jq -c '.Items[] | {materialId: .materialId.S, hasExecutionDate: (.executionDate != null), hasMaterialDate: (.materialDate != null), hasCategory: (.category != null)}'
```

### 2-2. `executionDate` がある行を変換（`materialDate` へコピーし、旧属性削除 + category 削除）

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_MATERIALS" \
  --projection-expression "materialId, executionDate" \
  --output json \
| jq -c '.Items[] | select(.executionDate != null) | {materialId: .materialId.S, materialDate: .executionDate.S}' \
| while read -r row; do
    material_id=$(echo "$row" | jq -r '.materialId')
    material_date=$(echo "$row" | jq -r '.materialDate')

    aws dynamodb update-item --no-cli-pager \
      --region "$AWS_REGION" \
      --table-name "$TABLE_MATERIALS" \
      --key "{\"materialId\":{\"S\":\"$material_id\"}}" \
      --update-expression "SET materialDate = :md REMOVE executionDate, category" \
      --expression-attribute-values "{\":md\":{\"S\":\"$material_date\"}}" \
    >/dev/null
  done
```

### 2-3. `executionDate` が無いが `category` が残っている行の `category` だけ削除

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_MATERIALS" \
  --projection-expression "materialId, category" \
  --output json \
| jq -c '.Items[] | select(.category != null) | {materialId: .materialId.S}' \
| while read -r row; do
    material_id=$(echo "$row" | jq -r '.materialId')

    aws dynamodb update-item --no-cli-pager \
      --region "$AWS_REGION" \
      --table-name "$TABLE_MATERIALS" \
      --key "{\"materialId\":{\"S\":\"$material_id\"}}" \
      --update-expression "REMOVE category" \
    >/dev/null
  done
```

### 2-4. `materialDate` が欠損している行を検出（必ず対応）

`materialDate` は必須です。`executionDate` が元々無い/欠損していたデータは、自動的に補完できません。

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_MATERIALS" \
  --projection-expression "materialId, materialDate" \
  --output json \
| jq -c '.Items[] | select(.materialDate == null) | {materialId: .materialId.S}'
```

上で出た `materialId` は、業務上妥当な「教材年月日(YYYY-MM-DD)」を決めて `update-item` で投入してください。

## 3) ReviewTests: items の `materialExecutionDate` → `materialDate`

ReviewTests テーブルは `items` がネスト配列のため、`update-item` の式だけで安全に一括リネームするのが難しいです。
この手順は **バックアップ済みであること** と、可能なら **書き込み停止（または低頻度時間帯）** を前提に、`scan` → 変換 → `put-item` で上書きします。

### 3-1. 変換して上書きする（`materialExecutionDate` を `materialDate` にコピーし、旧属性削除）

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_REVIEW_TESTS" \
  --output json \
| jq -c '.Items[]' \
| while read -r item; do
    fixed=$(echo "$item" | jq -c '
      if (.items? and .items.L?) then
        .items.L |= map(
          if (.M? and .M.materialExecutionDate? and (.M.materialDate | not)) then
            .M.materialDate = .M.materialExecutionDate
            | del(.M.materialExecutionDate)
          else
            del(.M.materialExecutionDate)
          end
        )
      else
        .
      end
    ')

    aws dynamodb put-item --no-cli-pager \
      --region "$AWS_REGION" \
      --table-name "$TABLE_REVIEW_TESTS" \
      --item "$fixed" \
    >/dev/null
  done
```

### 3-2. 変換後チェック

`materialExecutionDate` が残っていないことを確認します。

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_REVIEW_TESTS" \
  --output json \
| jq -e '.. | objects | has("materialExecutionDate") | select(. == true)' \
&& echo "NG: materialExecutionDate が残っています" \
|| echo "OK: materialExecutionDate は残っていません"

## 4) Materials: `grade` / `provider` の欠損チェック（必須）

`grade` / `provider` は必須です。欠損している既存行は、業務上妥当な値を決めて投入してください。

### 4-1. 欠損行を検出

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_MATERIALS" \
  --projection-expression "materialId, grade, provider" \
  --output json \
| jq -c '.Items[] | {materialId: .materialId.S, grade: (.grade.S // null), provider: (.provider.S // null)} | select(.grade == null or .provider == null)'
```

### 4-2. 欠損行を update-item で補完（例）

```bash
material_id="..."
grade="4年"
provider="SAPIX"

aws dynamodb update-item --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_MATERIALS" \
  --key "{\"materialId\":{\"S\":\"$material_id\"}}" \
  --update-expression "SET grade = :g, provider = :p" \
  --expression-attribute-values "{\":g\":{\"S\":\"$grade\"},\":p\":{\"S\":\"$provider\"}}"
```

## 5) ReviewTestCandidates: `questionKey` 削除 + `createdAt` 欠損チェック

Terraform の変更（GSI差し替え）を適用後、既存データの `questionKey` を削除します。

### 5-1. `questionKey` が残っている行を削除（REMOVE）

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_REVIEW_TEST_CANDIDATES" \
  --projection-expression "subject, candidateKey, questionKey" \
  --output json \
| jq -c '.Items[] | select(.questionKey != null) | {subject: .subject.S, candidateKey: .candidateKey.S}' \
| while read -r row; do
    subject=$(echo "$row" | jq -r '.subject')
    candidate_key=$(echo "$row" | jq -r '.candidateKey')

    aws dynamodb update-item --no-cli-pager \
      --region "$AWS_REGION" \
      --table-name "$TABLE_REVIEW_TEST_CANDIDATES" \
      --key "{\"subject\":{\"S\":\"$subject\"},\"candidateKey\":{\"S\":\"$candidate_key\"}}" \
      --update-expression "REMOVE questionKey" \
    >/dev/null
  done
```

### 5-2. `createdAt` 欠損行を検出（GSI の rangeKey なので必須）

```bash
aws dynamodb scan --no-cli-pager \
  --region "$AWS_REGION" \
  --table-name "$TABLE_REVIEW_TEST_CANDIDATES" \
  --projection-expression "subject, candidateKey, questionId, createdAt" \
  --output json \
| jq -c '.Items[] | {subject: .subject.S, candidateKey: .candidateKey.S, questionId: (.questionId.S // null), createdAt: (.createdAt.S // null)} | select(.questionId == null or .createdAt == null)'
```

`createdAt` が欠損している場合は、暫定的に `candidateKey` の先頭日付（`nextTime`）から `YYYY-MM-DDT00:00:00.000+09:00` を作って投入してください。

## 6) ロールバック
```

問題が起きた場合は、バックアップ JSON を元に `put-item` で復元できます（ただし復元時も同様にテーブル全体を書き戻すため慎重に）。

