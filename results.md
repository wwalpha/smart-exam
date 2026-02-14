# smart-exam CMD1〜CMD7 実施ログ

このファイルは CMD1.md〜CMD7.md の指示に従って、調査結果・設計・実装差分を順次追記します。

---

## PHASE 0 (CMD1) 現状把握（差分確定）

### 関連ファイル一覧（入口→永続化→PDF）

- API ルーティング（Express）
  - backend/src/app/createApp.ts
    - Kanji: `GET/POST/PATCH/DELETE /api/kanji...`
    - ReviewTests: `GET /api/review-tests/:testId/pdf`（PDF取得）

- Kanji API（現状は「単語マスタ(=漢字マスタ)」のCRUD/Import）
  - backend/src/controllers/kanji/createKanjiController.ts
  - backend/src/services/kanji/createKanjiService.ts
  - backend/src/repositories/WordMasterRepository.ts

- 復習テスト（worksheet相当: 出題ID一覧を保持しPDF化する仕組み）
  - backend/src/controllers/reviewTests/createReviewTestsController.ts
  - backend/src/services/reviewTests/createReviewTestsService.ts
  - backend/src/repositories/ReviewTestsRepository.ts
  - backend/src/services/reviewTests/reviewTestPdfService.ts（PDFレンダラー）

- DynamoDB スキーマ（型）
  - backend/src/types/db.ts

- Terraform（テーブル定義）
  - terraform/dynamodb.tf

### データフロー図（テキスト）

**Kanji 登録/更新（現状）**

1. backend/src/app/createApp.ts
   - `/api/kanji` 等のルートにリクエスト
2. backend/src/controllers/kanji/createKanjiController.ts
   - body/query を Zod でバリデーションして service を呼び出す
3. backend/src/services/kanji/createKanjiService.ts
   - `createKanji()` / `importKanji()` が ID 採番し、DB item へマッピング
   - 併せて復習テスト候補（review_test_candidates）も作成/再構築
4. backend/src/repositories/WordMasterRepository.ts
   - DynamoDB `word_master` テーブルに Put/Get/Update/Delete

**PDF 生成（現状: ReviewTest の PDF）**

1. backend/src/app/createApp.ts
   - `/api/review-tests/:testId/pdf` へアクセス
2. backend/src/controllers/reviewTests/createReviewTestsController.ts
   - `direct=1` のときは PDF Buffer を直接レスポンス（inline/attachment）
   - それ以外は S3 presign URL を返す
3. backend/src/services/reviewTests/createReviewTestsService.ts
   - `generateReviewTestPdfBuffer(testId)` → review detail を組み立てる
4. backend/src/services/reviewTests/reviewTestPdfService.ts
   - `pdf-lib` + `@pdf-lib/fontkit` で PDF を直描画
   - KANJI mode だけ横向き固定レイアウト（タイトル/作成日なし）
5. （KANJI mode で test 作成時）
   - createReviewTest() が PDF を生成し、S3 に `review-tests/{testId}.pdf` で保存

### DynamoDB テーブル / Item 構造（特定）

- 「教材の問題（試験問題）」は `material_questions` テーブル（backend/src/types/db.ts: `MaterialQuestionTable`）
- 「漢字（復習テストのKANJI対象）」は **専用テーブルではなく** `word_master` テーブル（backend/src/types/db.ts: `WordMasterTable`）
- word_master のキー
  - PK: `wordId`
  - GSI: `gsi_subject_word_id`（PK: `subject`, SK: `wordId`）

### 既存 DynamoDB Item の JSON サンプル（word_master）

現状の Kanji は `WordMasterTable` に以下の形で格納されます（属性は自由スキーマだが実装上はこの3つを利用）。

```json
{
  "wordId": "<uuid>",
  "subject": "SOC",
  "question": "憲法",
  "answer": "けんぽう"
}
```

補足:

- service 側の `Kanji` 表現は `kanji: question`, `reading: answer` にマッピングされています。

### PDF 生成方式の特定

- 方式: **PDF直描画**
- ライブラリ: `pdf-lib` + `@pdf-lib/fontkit`
- 日本語フォント:
  - backend/assets/fonts/NotoSansJP-VariableFont_wght.ttf を優先
  - ない場合は backend/assets/fonts/NotoSansJP-wght.ttf.gz を gunzip して利用
  - フォントは `subset: false`（全グリフ埋め込み）

### PDF 生成のエントリポイント / 主要関数

- エントリポイント（Service）
  - backend/src/services/reviewTests/createReviewTestsService.ts
    - `generateReviewTestPdfBuffer(testId)`
- レンダラー
  - backend/src/services/reviewTests/reviewTestPdfService.ts
    - `ReviewTestPdfService.generatePdfBuffer(review)`

### レイアウト計算の場所（KANJI固定レイアウト）

- backend/src/services/reviewTests/reviewTestPdfService.ts 内
  - `renderKanjiFixedLayout()`
    - A4横向き: `pageWidth = a4Height`, `pageHeight = a4Width`
    - 2列 × 15行 = 30問/ページ
    - 行ピッチ: `rowPitch = (topY - margin) / 15`
    - 描画: `page.drawText()`
    - 右端の記入用: **本文の右側に横線を引く**（本文内の部分下線ではない）

### worksheet（問題セット）のデータモデル

現状、worksheet相当は「復習テスト（review_tests）」が担っています。

- review_tests の Item（backend/src/types/db.ts: `ReviewTestTable`）
  - `questions: string[]` に targetId を保持（modeにより questionId/wordId）
  - `pdfS3Key?: string` に PDF の保存先を保持（KANJI modeで使用）

---

## PHASE 1 (CMD2) DynamoDB拡張（予定）

### 追加する属性一覧と型

対象: DynamoDB `word_master`（backend/src/types/db.ts: `WordMasterTable`）

- `promptText?: string`（本文）
- `answerKanji?: string`（答え）
- `readingHiragana?: string`（下線対象のひらがな）
- `underlineSpec?: { type: "promptSpan"; start: number; length: number }`
- `status?: "DRAFT" | "GENERATED" | "VERIFIED" | "ERROR"`
- `ai?: { model: string; promptVersion: string; generatedAt: string; rawHash?: string }`
- `error?: { code: string; message: string; at: string }`

TS型（api-types側）:

- packages/api-types/src/kanji-question.ts
  - `KanjiUnderlineSpec` / `KanjiQuestionStatus` / `KanjiQuestion` 等

### 互換性方針（既存Itemとの共存）

- 既存データは追加属性が欠損していても許容する（**追加のみ**）。
- デフォルト扱い（実装方針）
  - `status` が無い => `DRAFT` 扱い
  - `underlineSpec` が無い => 生成前として扱い、PDF生成対象にしない（または生成フェーズを必須にする）

### Repository 拡張

- backend/src/repositories/WordMasterRepository.ts
  - `updateKanjiQuestionFields(wordId, updates)` を追加
  - 既存の `update(wordId, updates)` を薄くラップして、読み/underlineSpec/status 等の更新口を明示化

### 変更ファイル一覧

- backend/src/types/db.ts
- backend/src/repositories/WordMasterRepository.ts
- packages/api-types/src/kanji-question.ts
- packages/api-types/src/index.ts

## PHASE 2 (CMD3) Upload処理（予定）

### 追加/変更したAPI仕様

- `POST /api/kanji/import`（統合）
  - request:
    - `subject: SubjectId`（必須）
    - `fileContent: string`（必須）
    - `importType?: "MASTER" | "QUESTIONS"`（任意、デフォルトは `MASTER`）
  - response:
    - `successCount: number`
    - `duplicateCount: number`
    - `errorCount: number`
    - `questionIds?: string[]`（作成されたID。DynamoDB上は `word_master.wordId`）
    - `errors: { line, content, reason }[]`

保存仕様:

- `importType="QUESTIONS"` の場合
  - `word_master` に1行=1件で作成
  - `promptText`, `answerKanji` を保存
  - `status = "DRAFT"`
  - `readingHiragana`, `underlineSpec` は未設定

### 入力パース仕様（エッジケース）

- 1行 = `本文|答え漢字`
- 各行は trim（全角スペースは半角スペースに置換してからtrim）
- 空行は無視
- `|` が無い / 2つ以上ある / 本文が空 / 答えが空 はエラー
- エラーは行番号（1始まり）で返す

### 変更ファイル一覧

- backend/src/app/createApp.ts
- backend/src/controllers/kanji/createKanjiController.ts
- backend/src/services/kanji/createKanjiService.ts
- packages/api-types/src/kanji.ts

## PHASE 3 (CMD4) 読み生成（Bedrock）＋ underlineSpec確定（予定）

### 追加したエンドポイント

- `POST /api/kanji/questions/:questionId/generate-reading`
  - 入力: path の `questionId` のみ（body なし）
  - 内部で DynamoDB(word_master) から `promptText` / `answerKanji` を取得して Bedrock を呼び出す

### Bedrock プロンプト（全文）

Converse の `messages[0].content[0].text` として以下を送信。

- System: 未使用（ConverseCommand の system フィールドは利用していない）
- User: 以下

```text
You are an AI assistant for Japanese kanji worksheet generation.

Task:
- Given a Japanese promptText (contains a hiragana reading somewhere) and answerKanji, identify the hiragana reading substring inside promptText that should be underlined.

Output requirements (STRICT):
- Return ONLY valid JSON.
- No markdown, no code fences, no explanations.

JSON schema:
{
  "readingHiragana": "<hiragana-only>",
  "underlineSpec": { "type": "promptSpan", "start": <int>, "length": <int> }
}

Rules:
- readingHiragana must be hiragana only (allow long vowel mark 'ー').
- start/length are JavaScript string indices (UTF-16 code units).
- The substring MUST match exactly: promptText.slice(start, start + length) === readingHiragana

Input:
promptText: "..."
answerKanji: "..."
hint: "..." (validation failure reason, when retry)
```

実装:

- backend/src/repositories/BedrockRepository.ts
  - `generateKanjiQuestionReading({ promptText, answerKanji, modelId?, hint? })`

### 期待 JSON / バリデーション（サーバ側）

期待 JSON:

```json
{
  "readingHiragana": "けいせい",
  "underlineSpec": { "type": "promptSpan", "start": 5, "length": 4 }
}
```

バリデーションルール:

- `readingHiragana` はひらがなのみ（長音記号 `ー` は許可）
- `underlineSpec.type === "promptSpan"`
- `start` / `length` は整数
- 範囲内: `0 <= start`, `0 < length`, `start + length <= promptText.length`
- 一致必須: `promptText.slice(start, start + length) === readingHiragana`
  - JavaScript の `slice`（UTF-16 code unit）基準

### リトライ条件

- Bedrock の返却 JSON が上記バリデーションを満たさない場合、最大2回リトライ（合計3回試行）
- リトライ時は直前の失敗理由を `hint` として追加して再要求

### 保存仕様（DynamoDB: word_master）

- 成功:
  - `readingHiragana`, `underlineSpec`, `status="GENERATED"`
  - `ai.{ model, promptVersion, generatedAt }`
- 失敗（3回とも失敗）:
  - `status="ERROR"`
  - `error.{ code="GENERATE_READING_FAILED", message, at }`

### 変更ファイル一覧

- backend/src/repositories/BedrockRepository.ts
- backend/src/repositories/createRepositories.ts
- backend/src/services/kanjiQuestions/createKanjiQuestionsService.ts
- backend/src/controllers/kanjiQuestions/createKanjiQuestionsController.ts
- backend/src/services/createServices.ts
- backend/src/controllers/createControllers.ts
- backend/src/app/createApp.ts
- backend/tests/services/KanjiQuestionsService.test.ts

## PHASE 4 (CMD5) 手修正・検証ステータス（予定）

### 追加したエンドポイント

- `PATCH /api/kanji/questions/:questionId`
  - 更新可能: `readingHiragana`, `underlineSpec(promptSpan)`, `status`（ただし `VERIFIED` は不可）
  - バリデーション: PHASE3 と同じ（slice一致必須）
- `POST /api/kanji/questions/:questionId/verify`
  - `status` を `VERIFIED` にする（前提: `readingHiragana` / `underlineSpec` が揃っていて整合が取れている）

### PATCH の request/response 例

Request:

```json
{
  "readingHiragana": "けいせい",
  "underlineSpec": { "type": "promptSpan", "start": 2, "length": 4 }
}
```

Response（例）:

```json
{
  "id": "<questionId>",
  "subject": "1",
  "promptText": "彼はけいせいを説明した。",
  "answerKanji": "形成",
  "readingHiragana": "けいせい",
  "underlineSpec": { "type": "promptSpan", "start": 2, "length": 4 },
  "status": "GENERATED"
}
```

注意:

- `PATCH` で `status: "VERIFIED"` は拒否（verify専用）
- `readingHiragana` / `underlineSpec` は **結果として両方揃っていること** が必須

### verify の状態遷移ルール

- 基本フロー: `DRAFT → GENERATED → VERIFIED`
- `ERROR` は生成失敗時の状態（PHASE3）。
  - 人手修正 `PATCH` で整合が取れた内容を保存でき、以後 `verify` に進める。
- `verify` は `readingHiragana` / `underlineSpec` の整合チェックを通った場合のみ `VERIFIED` に遷移
- `VERIFIED` は印刷対象の前提（PHASE5で PDF 対象を `VERIFIED` に限定する想定）

### 変更ファイル一覧

- backend/src/services/kanjiQuestions/createKanjiQuestionsService.ts
- backend/src/controllers/kanjiQuestions/createKanjiQuestionsController.ts
- backend/src/app/createApp.ts
- backend/src/repositories/WordMasterRepository.ts
- backend/tests/services/KanjiQuestionsService.test.ts

## PHASE 5 (CMD6) PDF生成（予定）

### 対象エンドポイント（既存拡張）

- 既存: `GET /api/review-tests/:testId/pdf`
  - ローカル検証用 `direct=1` の場合のみ `includeGenerated=1` を追加で解釈
    - 既定: `VERIFIED` のみ出力
    - `includeGenerated=1`: `GENERATED` も出力

### PDFレイアウト仕様（KANJIモード）

- 用紙: A4 landscape
- 1ページ固定（まず1ページのみ）
- 60問/頁（左右2列）
  - 左列30問、右列30問
- ヘッダなし、解答なし
- 各行: `番号 + 本文(promptText)` を描画
- 下線: `underlineSpec(promptSpan)` の範囲（本文中の readingHiragana）だけ下線
- 右端: 漢字記入枠（枠のみ）

数値（実装値）:

- margin: 12mm（既存値を流用）
- columnGap: 8mm
- itemsPerPage: 60
- rowsPerColumn: 30
- answerBoxWidth: 22mm
- answerBoxGap: 2.5mm
- baseFontSize: 9.5（必要に応じて縮小、最小 8）
- answerBoxHeight: `rowPitch * 0.8`（行高に追従）

### underline座標の計算方法（要点）

1. 描画テキストは `indexText = "{n}. "` を prefix として、本文 `promptText` を続けて描画
2. `promptText` を `pre / target / post` に分割
   - `pre = promptText.slice(0, start)`
   - `target = promptText.slice(start, start+length)`
3. `pdf-lib` の `font.widthOfTextAtSize(text, fontSize)` で幅を計測
   - underline開始X: `baseX + width(indexText + pre)`
   - underline終了X: `startX + width(target)`
4. underlineY は `textY - 0.6mm` に固定して `drawLine()`

### フィルタ/整合チェック方針（事故防止）

- 既定では `status === VERIFIED` のみ印刷対象
- `promptText / readingHiragana / underlineSpec` が欠けている場合はエラー
- `promptText.slice(start, start+length) === readingHiragana` が成立しない場合はエラー

### 変更ファイル一覧

- packages/api-types/src/review.ts
- backend/src/services/reviewTests/createReviewTestsService.ts
- backend/src/services/reviewTests/reviewTestPdfService.ts
- backend/src/controllers/reviewTests/createReviewTestsController.ts

## PHASE 6 (CMD7) 回帰テスト（予定）

### 追加したテスト一覧

- backend/tests/services/KanjiImportQuestionsFormat.test.ts
  - `importType="QUESTIONS"` の "本文|答え" 形式の正常/異常
  - 行番号付きエラー（1始まり）
  - 既存/同一ファイル内の重複カウント
- backend/tests/services/ReviewTestPdfKanjiWorksheet.test.ts
  - 60問（VERIFIED）でPDF生成が例外なく完走
  - PDFページ数=1 を検証（pdf-libでloadしてpageCount確認）

### 事故になり得るケースと担保テスト

- 入力不正で「本文|答え」のパースが壊れる
  - → KanjiImportQuestionsFormat で異常行（区切りなし/区切り複数/空欄）を行番号付きで検出
- underlineSpec と reading の不整合で下線ズレが混入
  - → KanjiQuestionsService 系テストで slice一致必須（PHASE3/4）
  - → PDFスモークで 60問のレンダリング経路を実行し、例外なく完走することを担保
- 60問固定レイアウトで描画が途中で落ちる
  - → ReviewTestPdfKanjiWorksheet で1ページ生成を検証
