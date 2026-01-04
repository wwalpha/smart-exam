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


