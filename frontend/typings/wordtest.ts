// 単語テストの科目コード（社会=3、国語=1）
export type WordTestSubject = '3' | '1'

// 単語テスト一覧で扱うサマリ型（詳細は含まない）
export type WordTest = {
  // 単語テストID
  id: string
  // 単語テスト名
  name: string
  // 科目（コード値）
  subject: WordTestSubject
  // 作成日時（ISO文字列）
  created_at: string
  // 採点済みかどうか
  is_graded: boolean
}

// 単語テスト詳細で扱う型（問題/答えを含む）
export type WordTestDetail = WordTest & {
  // 出題アイテム（問題/答え）
  items: WordTestItem[]
}

// 出題アイテム（問題と答え）
export type WordTestItem = {
  // 問題ID（同一テスト内で一意）
  qid: string
  // 問題文
  question: string
  // 解答
  answer: string
  // 採点結果（未採点の場合は undefined）
  grading?: WordTestGradingValue
}

// 採点結果の値（'0'=不正解、'1'=正解）
export type WordTestGradingValue = '0' | '1'

// 採点反映に必要なパラメータ
export type ApplyWordTestGradingParams = {
  // 対象の単語テストID
  wordTestId: string
  // 各問題に対応する採点結果（items と同じ順序）
  grading: WordTestGradingValue[]
}

// 単語テスト一覧取得リクエスト（クエリ無しの空オブジェクト）
export type ListWordTestsRequest = Record<string, never>

// 単語テスト一覧取得レスポンス
export type ListWordTestsResponse = {
  // 一覧データ
  datas: WordTest[]
}

// 単語テスト詳細取得リクエスト
export type GetWordTestRequest = {
  // 取得対象の単語テストID
  wordTestId: string
}

// 単語テスト詳細取得レスポンス
export type GetWordTestResponse = {
  // 単語テスト詳細
  wordTest: WordTestDetail
  // 採点結果（未採点の場合は null）
  grading: WordTestGradingValue[] | null
}

// 採点反映リクエスト
export type ApplyWordTestGradingRequest = ApplyWordTestGradingParams

// 採点反映レスポンス
export type ApplyWordTestGradingResponse = {
  // 成功フラグ
  ok: true
}

// 単語テスト作成リクエスト
export type CreateWordTestRequest = {
  // 作成する科目（コード値）
  subject: WordTestSubject
}

// 単語テスト作成レスポンス
export type CreateWordTestResponse = {
  // 作成された単語テスト（サマリ）
  wordTest: WordTest
}
