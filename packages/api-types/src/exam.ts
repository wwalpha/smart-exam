/**
 * 試験問題（過去問など）
 */
export type ExamPaper = {
  /** 試験ID */
  paper_id: string;
  /** 学年 */
  grade: string;
  /** 科目 */
  subject: string;
  /** カテゴリ（例: 合不合判定テスト） */
  category: string;
  /** 試験名 */
  name: string;
  /** 問題PDFのS3キー */
  question_pdf_key: string;
  /** 解答PDFのS3キー */
  answer_pdf_key: string;
  /** 作成日時 (ISO 8601) */
  created_at: string;
};

/**
 * 試験結果
 */
export type ExamResult = {
  /** 結果ID */
  result_id: string;
  /** 関連する試験ID（任意） */
  paper_id?: string;
  /** 学年 */
  grade: string;
  /** 科目 */
  subject: string;
  /** カテゴリ */
  category: string;
  /** 受験者名 */
  name: string;
  /** タイトル */
  title: string;
  /** 受験日 (YYYY-MM-DD) */
  test_date: string;
  /** 得点 */
  score?: number;
  /** 採点済み答案PDFのS3キー */
  graded_pdf_key?: string;
  /** 詳細結果リスト */
  details: {
    /** 問題番号 */
    number: number;
    /** 正誤フラグ */
    is_correct: boolean;
  }[];
  /** 作成日時 (ISO 8601) */
  created_at: string;
};

/** 試験問題作成リクエスト */
export type CreateExamPaperRequest = Omit<ExamPaper, 'paper_id' | 'created_at'>;

/** 試験結果作成リクエスト */
export type CreateExamResultRequest = Omit<ExamResult, 'result_id' | 'created_at'>;

/** 試験問題一覧取得レスポンス */
export type ListExamPapersResponse = {
  datas: ExamPaper[];
};

/** 試験結果一覧取得レスポンス */
export type ListExamResultsResponse = {
  datas: ExamResult[];
};

/** アップロード用URL取得レスポンス */
export type UploadUrlResponse = {
  /** 署名付きURL */
  url: string;
  /** 保存先のS3キー */
  key: string;
};
