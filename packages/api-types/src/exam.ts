import type { SubjectId } from './subject';

/**
 * 試験問題（過去問など）
 */
export type ExamPaper = {
  /** 試験ID */
  paperId: string;
  /** 学年 */
  grade: string;
  /** 科目 */
  subject: SubjectId;
  /** カテゴリ（例: 合不合判定テスト） */
  category: string;
  /** 試験名 */
  name: string;
  /** 問題PDFのS3キー */
  questionPdfKey: string;
  /** 解答PDFのS3キー */
  answerPdfKey: string;
};

/**
 * 試験結果
 */
export type ExamResult = {
  /** 結果ID */
  resultId: string;
  /** 関連する試験ID（任意） */
  paperId?: string;
  /** 学年 */
  grade: string;
  /** 科目 */
  subject: SubjectId;
  /** カテゴリ */
  category: string;
  /** 受験者名 */
  name: string;
  /** タイトル */
  title: string;
  /** 受験日 (YYYY-MM-DD) */
  testDate: string;
  /** 得点 */
  score?: number;
  /** 採点済み答案PDFのS3キー */
  gradedPdfKey?: string;
  /** 詳細結果リスト */
  details: {
    /** 問題番号 */
    number: number;
    /** 正誤 */
    isCorrect: boolean;
    /** 配点/得点 */
    score?: number;
  }[];
};

/** 試験問題作成リクエスト */
export type CreateExamPaperRequest = Omit<ExamPaper, 'paperId'>;

/** 試験問題作成レスポンス */
export type CreateExamPaperResponse = ExamPaper;

/** 試験結果作成リクエスト */
export type CreateExamResultRequest = Omit<ExamResult, 'resultId'>;

/** 試験結果作成レスポンス */
export type CreateExamResultResponse = ExamResult;

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
