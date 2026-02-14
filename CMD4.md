[PHASE 3] 読み生成（Bedrock/Claude）＋ underlineSpec確定（promptSpan）
目的: DRAFTの漢字問題に対して、Bedrock(Claude 4.5 Sonnet想定)で readingHiragana と underlineSpec(start/length) をJSONで生成し、整合チェックの上で保存する。

やること:

1. エンドポイント追加:
   - POST /kanji/questions/{id}/generate-reading （命名は既存規約に合わせる）
   - 入力: questionId（path）だけでよい。内部でDynamoDBから promptText/answerKanji を取得する。
2. Bedrock呼び出し:
   - モデル/クライアントは既存のbedrock wrapperがあれば流用
   - 出力は必ず JSON のみ を要求（説明文禁止）
   - 期待JSON:
     {
     "readingHiragana": "けいせい",
     "underlineSpec": { "type": "promptSpan", "start": 5, "length": 4 }
     }
   - start/length は JavaScriptの文字インデックス（UTF-16 code unit基準）で扱う前提にする（後でPDF描画も同基準で切り出す）
3. バリデーション（サーバ側）:
   - readingHiragana はひらがなのみ（必要なら「ー」許可）
   - underlineSpec.type == "promptSpan"
   - start/length が範囲内
   - promptText.slice(start, start+length) == readingHiragana が成立する
   - 失敗したら最大2回リトライ（同じプロンプトでよいが、失敗理由を追加して再要求）
4. 保存:
   - 成功: readingHiragana, underlineSpec, status="GENERATED", ai.{model,promptVersion,generatedAt}
   - 失敗: status="ERROR", error情報を保存
5. results.md に以下を追記:
   - Bedrockプロンプト全文（システム/ユーザー部分）
   - JSONスキーマとバリデーションルール
   - リトライ条件
   - 変更ファイル一覧（パス）

制約:

- 生成結果が整合しない場合は「PDF生成に進めない」方向に倒す（事故防止）。
- 既存の環境変数/設定方式に合わせる（モデル名やリージョンは既存から）。

完了条件:

- 1問のDRAFTに対してGENERATEDになり、reading/underlineSpecが保存される。
- わざと不正なケースでERRORになり、理由が保存される。

必ず results.md に追記して終了すること。
