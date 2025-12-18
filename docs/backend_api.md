# Backend API 一覧

本書は [要件定義書.md](../要件定義書.md) をベースに、Smart Exam の Backend API の「一覧」を記載します。

- Request / Response の詳細定義は [docs/swagger.yml](swagger.yml) に記載します。
- DynamoDB のテーブル定義は [docs/dynamodb_tables.md](dynamodb_tables.md) に記載します。

---

## エンドポイント一覧（v1）

### Catalog（科目/テスト/問題）
- GET `/v1/subjects` : 科目一覧（科目別フィルタ用）
- GET `/v1/tests?subjectid={subjectid}` : テスト一覧（科目別フィルタ）
- GET `/v1/tests/{testid}/questions` : 問題一覧（問題選択・不正解再実施用）

### Attempts（オンライン実施/結果保管）
- POST `/v1/attempts` : 実施開始
- POST `/v1/attempts/{attemptid}/submit` : 解答提出（正誤結果を保管）
- GET `/v1/tests/{testid}/results` : テスト結果取得（正誤表示）
- GET `/v1/tests/{testid}/wrongquestions` : 不正解問題取得（再実施用）

### AnswerSheets（解答用紙の作成・印刷）
- POST `/v1/answersheets` : 問題を手動選択して解答用紙を作成（印刷用）

### Files（S3 署名付きURL）
- POST `/v1/files/presignupload` : アップロード用 署名付きURL発行（採点済み用紙など）
- POST `/v1/files/presigndownload` : ダウンロード用 署名付きURL発行（解答用紙PDFなど）

### GradedSheets（採点済み用紙アップロード→AI解析→正誤表示）
- POST `/v1/gradedsheets` : 採点済み用紙登録（AI解析開始）
- GET `/v1/gradedsheets/{gradedsheetid}` : 解析ステータス/正誤結果取得

### Explanations（AI解説生成）
- POST `/v1/questions/{questionid}/explanations` : 解説生成（疑似問題生成はしない）

### Words（単語マスタ）
- POST `/v1/words` : 単語（Q/A）登録（単語テスト用）
- GET `/v1/words` : 単語一覧
- DELETE `/v1/words/{wordid}` : 単語削除

### WordTests（単語テスト）
- POST `/v1/wordtests` : 指定数の単語テスト（漢字テスト）作成
- GET `/v1/wordtests` : 作成済み単語テスト一覧
- DELETE `/v1/wordtests/{wordtestid}` : 単語テスト削除
- GET `/v1/wordtests/{wordtestid}/pdf` : 単語テストPDFダウンロードURL取得

### WordTestAttempts（単語テストの正誤登録）
- POST `/v1/wordtestattempts` : 単語テスト実施開始（正誤登録用 attempt 作成）
- POST `/v1/wordtestattempts/{wordtestattemptid}/submit` : 単語テストの正誤提出
