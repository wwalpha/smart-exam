[PHASE 5] PDF生成（A4横・60問/頁・左右30・ヘッダなし・解答なし・本文中下線）
目的: 指定レイアウトのPDFを生成できるようにする。PDFは1ページ60問、左右に30問ずつ、タイトル/名前なし、解答ページなし、本文中の readingHiragana の箇所に下線、右端に漢字記入枠。

やること:

1. PDF生成エンドポイント（既存があれば拡張、無ければ追加）:
   - POST /worksheets/{worksheetId}/pdf （命名は既存に合わせる）
2. worksheetId から questionId一覧を取得し、最大60問を1ページに配置（まず1ページ固定でOK）。
3. レイアウト:
   - A4 landscape
   - 左列30問、右列30問
   - 各行: "番号 + 本文（promptText）" を描画
   - underlineSpec(promptSpan)の範囲だけ下線（座標計算: pre幅/target幅を計測して線を引く）
   - 右端に漢字記入用の枠（固定サイズ）
   - フォントは日本語対応（既存の指定に合わせる）
4. 対象フィルタ:
   - 既定では VERIFIEDのみを出力（運用が無い場合は GENERATEDも許可するフラグを用意）
   - underlineSpecが無いものは除外 or エラー（方針を決めて実装）
5. results.md に以下を追記:
   - PDFレイアウト仕様（数値: margin, column width, line height, box size）
   - 実装した描画ロジックの要点（underline座標の計算方法）
   - 変更ファイル一覧（パス）

制約:

- HTML→PDFではなく、既存がPDF直描画なら同方式で。
- まず1ページ（60問）固定でOK。複数ページは次フェーズでもよい。

完了条件:

- サンプル60問で、指定通りのPDFが生成できる
- 本文中の読み部分に下線が引かれている
- ヘッダなし、解答なし

必ず results.md に追記して終了すること。
