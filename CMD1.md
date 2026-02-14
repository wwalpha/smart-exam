[PHASE 0] 現状把握（差分確定）
目的: 「漢字問題 upload → DynamoDB保存 → PDF生成」の現状実装を把握し、追加フィールド/追加APIの差分が最小になるように設計判断を確定する。

やること:

1. リポジトリ内で “漢字/kanji” “upload” “worksheet” “pdf” “dynamodb” “problem/question” を起点に関連実装を探索し、入口(API)→永続化(DynamoDB)→参照(PDF生成)の呼び出し関係を図にまとめる。
2. DynamoDB のテーブル定義/Item構造（PK/SK、既存属性、GSI有無）を確認し、「漢字問題」が他の問題タイプと同じItemで管理されているか、別テーブルかを特定する。
3. PDF生成の方式を特定する（HTML→PDFか、PDF直描画か、ライブラリ何を使っているか）。フォント設定/レイアウト計算箇所の位置も特定する。
4. “worksheet（問題セット）” のデータモデル（どこにquestionId一覧を持つか、並び順、ページング）を確認する。
5. 結果として、以下を results.md に追記する:
   - 関連ファイル一覧（パス）と各役割（upload handler / service / repository / pdf renderer 等）
   - データフロー図（テキストでOK）
   - 既存DynamoDB ItemのJSONサンプル（漢字問題が無ければ最も近い問題タイプの例）
   - PDF生成のエントリポイント/主要関数と、レイアウト計算の場所

制約:

- TypeScriptのみ。既存の構造を尊重しつつ、差分最小で。
- このフェーズでは実装変更はしない（調査と記録のみ）。

完了条件:

- Phase1で追加するDynamoDB属性を「どのItem/どの型」に追加するかが決まり、Phase2以降の変更箇所が列挙できていること。

必ず results.md に追記して終了すること。
