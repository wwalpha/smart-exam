[PHASE 2] Upload処理（入力→DRAFT保存）
目的: 「本文|答え漢字」形式のアップロードを受け取り、DynamoDBに DRAFT として保存できるようにする（生成は別フェーズ）。

やること:

1. Phase0で特定した upload のAPI/handler を拡張し、漢字問題のアップロードエンドポイント（または既存の問題uploadの中の漢字分岐）を実装する。
2. 入力フォーマット:
   - 1行 = "本文|答え漢字"
   - 行末空白/全角スペースなどをtrim
   - "|" が無い/多すぎる/本文空/答え空はエラーとして弾く（どの行が失敗か返す）
3. 保存:
   - questionId採番（既存流儀に合わせる）
   - promptText, answerKanji を保存
   - status = "DRAFT"
   - readingHiragana/underlineSpec は未設定
4. レスポンス:
   - 成功: 作成された questionIds（または batchId と件数）
   - 部分失敗: 行番号と理由の配列を返す（既存のエラーフォーマットに合わせる）
5. results.md に以下を追記:
   - 追加/変更したAPI仕様（path, method, request/response例）
   - 入力パースの仕様（エッジケース）
   - 変更ファイル一覧（パス）

制約:

- 同期でBedrockを呼ばない（このフェーズでは保存のみ）。
- 既存uploadの戻り形式/エラー形式に合わせる。

完了条件:

- サンプル入力（数行）でDynamoDBにDRAFTが保存される。
- 不正行が適切にエラー扱いされる。

必ず results.md に追記して終了すること。
