# CMD1〜CMD3 実施ログ（更新版）

CMD1.md〜CMD3.md の新しいタスクに従って、差分（設計・実装・テスト）を記録する。

---

## CMD1（PHASE 1）QUESTIONS import を既存添付フォーマットに統合

### 変更点サマリ

- import API は `POST /api/kanji/import` のまま維持
- 取り込み形式は `本文|答え漢字|YYYY-MM-DD,OK|...` の1種類
- 旧 QUESTIONS 専用パーサ（`本文|答え` しか受けない / `|` が複数あるとエラー）を削除し、pipe+履歴の1系統に統合

### 削除した重複処理

- `createKanjiService.importKanji()` 内の `parsePromptAnswerLine` を削除

### 新規追加関数

- `parsePipeQuestionLine(line)` を追加
  - `parts[0] => promptText`
  - `parts[1] => answerKanji`
  - `parts[2..] => 履歴トークン（YYYY-MM-DD,OK/NG）`
  - 履歴の token 解釈は既存 `parsePipeLine` と同一（`DateUtils.formatYmd` + OK/NG）

### 履歴がある場合の候補復元ルール（事故防止）

- QUESTIONS import は import 直後の `word_master.status` が `DRAFT` のため、候補が `OPEN` になるとテスト生成→PDFで事故り得る
- そのため、履歴がある行でも「最終候補」は必ず `EXCLUDED` で作成し、`listDueCandidates`（status=OPEN）から除外
  - 履歴自体は `CLOSED` で復元しつつ、最後の1件だけ `EXCLUDED`

### 変更ファイル（CMD1）

- backend/src/services/kanji/importUtils.ts
- backend/src/services/kanji/createKanjiService.ts
- backend/tests/services/KanjiImportQuestionsFormat.test.ts

---

## CMD2（PHASE 2）VERIFIED 時にのみ OPEN 候補を作成

### 目的

- `DRAFT/GENERATED` が due 候補（OPEN）に混入して、KANJI PDF生成が落ちる事故を防止

### 実装

- `kanjiQuestions.verify(id)` 成功時に、対象の `OPEN` 候補が無い場合のみ作成
  - `getLatestOpenCandidateByTargetId({ subject, targetId })` を確認
  - 無ければ `nextTime=DateUtils.todayYmd()` の `OPEN` を `correctCount=0` で追加

### 変更ファイル（CMD2）

- backend/src/services/kanjiQuestions/createKanjiQuestionsService.ts
- backend/tests/services/KanjiQuestionsService.test.ts

---

## CMD3（PHASE 3）PDF仕様は維持し、一気通貫の検証導線を追加

### PDF側の結論

- 既存の KANJI worksheet PDF は仕様（A4横・60問/頁・ヘッダなし・本文中下線・解答なし・記入枠のみ）を満たしているため、PDFロジック自体は変更不要

### 追加した検証（import→generate→verify→pdf）

- 取り込み（履歴あり）
- `generate-reading` → `verify` を通し、verify時に OPEN 候補が作られることを確認
- VERIFIED を60件相当で `ExamPdfService.generatePdfBuffer()` が成功し、PDFページ数が1であることを確認

### 変更ファイル（CMD3）

- backend/tests/services/KanjiImportToPdfFlow.test.ts
