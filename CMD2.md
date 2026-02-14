[PHASE 1] DynamoDB拡張（再現性の核）
目的: 本文中の読み（ひらがな）に下線を引くPDFを安定再現するために、DynamoDBへ必要最小の属性を追加し、型と互換性方針を確定する。

やること:

1. Phase0で特定した「漢字問題Item（または問題共通Item）」に以下を追加する設計を行う（既存互換: 追加のみ、既存は欠損許容）:
   - promptText: string（本文）
   - answerKanji: string（答え）
   - readingHiragana: string（下線対象のひらがな）
   - underlineSpec: { type: "promptSpan"; start: number; length: number } を基本とする
   - status: "DRAFT" | "GENERATED" | "VERIFIED" | "ERROR"
   - ai: { model: string; promptVersion: string; generatedAt: string; rawHash?: string }（任意）
   - error?: { code: string; message: string; at: string }（任意）
2. 既存のType定義（Problem/Question型など）を拡張し、漢字問題の型を明確化する（discriminated unionがあれば活用）。
3. DynamoDBアクセス層（repository）で「読み/underlineSpec/status」を更新するメソッドを追加する（Put/Updateの使い分けは既存に合わせる）。
4. 追加属性が無い既存データの扱い（デフォルト）を決める:
   - statusが無い => DRAFT扱い
   - underlineSpecが無い => PDF生成対象外 or 生成前として扱う
5. results.md に以下を追記:
   - 追加する属性一覧と型（TS型定義も貼る）
   - 既存Itemとの互換性方針
   - 変更したファイル一覧（パス）

制約:

- 既存のテーブル/キー設計は変更しない。
- 既存の問題タイプへの影響を最小化（型の破壊的変更禁止）。

完了条件:

- ビルドが通り、型定義とDynamoDB更新メソッドが揃っている。

必ず results.md に追記して終了すること。
