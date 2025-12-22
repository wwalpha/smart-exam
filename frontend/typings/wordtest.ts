// 単語テストの科目コード（社会=3、国語=1）
export type WordTestSubject = '3' | '1';

// 単語テスト一覧で扱うサマリ型（詳細は含まない）
export type WordTestTitle = {
  // 単語テストID
  id: string;
  // 単語テスト名
  name: string;
  // 科目（コード値）
  subject: WordTestSubject;
  // 作成日時（ISO文字列）
  created_at: string;
  // 採点済みかどうか
  is_graded: boolean;
};

// 出題アイテム（問題と答え）
export type WordTestItem = {
  // 問題ID（同一テスト内で一意）
  qid: string;
  // 問題文
  question: string;
  // 解答
  answer: string;
  // 採点結果（未採点の場合は undefined）
  grading?: GradingValue;
};

// 採点結果の値（'0'=不正解、'1'=正解）
export type GradingValue = '0' | '1';

// 採点反映のデータ（qid と採点結果）
export type GradingData = {
  // 問題ID
  qid: string;
  // 採点結果
  grading: GradingValue;
};

// 単語テスト一覧取得リクエスト（クエリ無しの空オブジェクト）
export type ListWordTestsRequest = Record<string, never>;

// 単語テスト一覧取得レスポンス
export type ListWordTestsResponse = {
  // 一覧データ
  datas: WordTestTitle[];
};

// 単語テスト詳細取得リクエスト
export type GetWordTestDetailRequest = {
  // 取得対象の単語テストID
  wordTestId: string;
};

// 単語テスト詳細取得レスポンス（WordTestDetail は廃止し、id と items のみ返す）
export type GetWordTestDetailResponse = {
  // 単語テストID
  id: string;
  // 出題アイテム（問題/答え）
  items: WordTestItem[];
};

// 採点反映リクエスト（body）
export type ApplyWordTestGradingRequest = {
  // 採点結果
  results: GradingData[];
};

// 採点反映レスポンス
export type ApplyWordTestGradingResponse = void;

// 単語テスト作成リクエスト
export type CreateWordTestRequest = {
  // 作成する科目（コード値）
  subject: WordTestSubject;
  // 作成する問題数
  count: number;
};

// 単語テスト作成レスポンス（作成された単語テスト（サマリ）をそのまま返す）
export type CreateWordTestResponse = WordTestTitle;
