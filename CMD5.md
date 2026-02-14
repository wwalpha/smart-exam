[PHASE 4] 手修正・検証ステータス（印刷事故防止）
目的: 生成ミスを人手で直せる導線と、印刷対象を制御するための VERIFIED ステータスを追加する。

やること:

1. PATCH /kanji/questions/{id}
   - 更新可能: readingHiragana, underlineSpec(promptSpan), status（必要なら）
   - バリデーション: Phase3と同じ整合チェック（slice一致必須）
2. POST /kanji/questions/{id}/verify
   - status を "VERIFIED" にする（前提: reading/underlineSpecが揃っている）
3. 既存UI/管理画面があるなら最小追加（無ければAPIのみでOK）
4. results.md に以下を追記:
   - 修正APIのrequest/response例
   - verifyの状態遷移ルール（DRAFT→GENERATED→VERIFIED、ERRORの扱い）
   - 変更ファイル一覧（パス）

制約:

- underlineSpecは基本promptSpanのみ（ここでmatch等は増やさない）。
- 既存の認可/認証がある場合は同等に適用。

完了条件:

- reading/underlineSpecを手修正して保存できる
- verifyでVERIFIEDになり、以後PDF対象として扱える

必ず results.md に追記して終了すること。
