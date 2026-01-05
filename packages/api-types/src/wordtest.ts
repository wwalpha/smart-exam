import type { SubjectId } from './subject';

/**
 * 単語テストの科目コード
 */
export type WordTestSubject = SubjectId;

/**
 * 単語テスト一覧で扱うサマリ型（詳細は含まない）
 */
export type WordTestTitle = {
  /** 単語テストID */
  id: string;
  /** 単語テスト名 */
  name: string;
  /** 科目（コード値） */
  subject: WordTestSubject;
  /** 作成日時（ISO文字列） */
  createdAt: string;
  /** 採点済みかどうか */
  isGraded: boolean;
};

/**
 * 出題アイテム（問題と答え）
 */
export type WordTestItem = {
  /** 問題ID（同一テスト内で一意） */
  qid: string;
  /** 問題文 */
  question: string;
  /** 解答 */
  answer: string;
  /** 採点結果（未採点の場合は undefined） */
  grading?: GradingValue;
};

/** 採点結果の値（'0'=不正解、'1'=正解） */
export type GradingValue = '0' | '1';

/**
 * 採点反映のデータ（qid と採点結果）
 */
export type GradingData = {
  /** 問題ID */
  qid: string;
  /** 採点結果 */
  grading: GradingValue;
};

/** 単語テスト一覧取得リクエスト（クエリ無しの空オブジェクト） */
export type ListWordTestsRequest = Record<string, never>;

/**
 * `GET /wordtests`
 * 単語テスト一覧取得レスポンス
 */
export type ListWordTestsResponse = {
  datas: WordTestTitle[];
};

/**
 * `GET /wordtests/:wordTestId`
 * 単語テスト詳細取得リクエスト（path params）
 */
export type GetWordTestDetailRequest = {
  wordTestId: string;
};

/**
 * `GET /wordtests/:wordTestId`
 * 単語テスト詳細取得レスポンス
 */
export type GetWordTestDetailResponse = {
  id: string;
  items: WordTestItem[];
};

/**
 * `POST /wordtests`
 * 単語テスト作成リクエスト
 */
export type CreateWordTestRequest = {
  /** テスト名（任意。未指定の場合はサーバ側で自動生成しても良い） */
  name?: string;
  /** 科目（コード値） */
  subject: WordTestSubject;
  /** 出題元（グループ等の識別子） */
  sourceId?: string;
  /** 出題数 */
  count: number;
  /** 採点済み答案（任意） */
  gradedAnswerSheet?: File;
  /** 問題用紙（任意） */
  questionPaper?: File;
  /** 解答（任意） */
  answerKey?: File;
};

/**
 * `POST /wordtests`
 * 単語テスト作成レスポンス
 */
export type CreateWordTestResponse = WordTestTitle;

/**
 * `POST /wordtests/:wordTestId/grading`
 * 採点反映リクエスト
 */
export type ApplyWordTestGradingRequest = {
  results: GradingData[];
};

/**
 * `POST /wordtests/:wordTestId/grading`
 * 採点反映レスポンス（本文無し）
 */
export type ApplyWordTestGradingResponse = Record<string, never>;
