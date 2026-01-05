/**
 * 科目テーブル
 */
export interface SubjectTable {
  /** 科目ID (PK) */
  subjectId: string;
  /** 科目名 */
  name: string;
}

/**
 * テストテーブル
 */
export interface TestTable {
  /** テストID (PK) */
  testId: string;
  /** 科目ID (GSI1 PK) */
  subjectId: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 問題数 */
  questionCount: number;
  /** 学年 */
  grade?: string;
  /** 提供元 */
  provider?: string;
  /** テスト種別 */
  testType?: string;
  /** 単元 */
  unit?: string;
  /** コース */
  course?: string;
  /** キーワード */
  keywords?: string[];
  /** 解答用紙S3パス */
  answerSheetPath?: string;
  /** 教材年月 (YYYY-MM) */
  yearMonth?: string;
  /** 実施日 - 旧データ互換用 */
  date?: string;
}

/**
 * 問題テーブル
 */
export interface QuestionTable {
  /** 問題ID (PK) */
  questionId: string;
  /** テストID (GSI1 PK) */
  testId: string;
  /** 科目ID */
  subjectId: string;
  /** 問題番号 (GSI1 SK) */
  number: number;
  /** プロンプトS3キー */
  promptS3Key?: string;
  /** 識別キー */
  canonicalKey: string;
  /** 表示ラベル */
  displayLabel: string;
  /** カテゴリ */
  category?: string;
  /** タグ */
  tags?: string[];
}

/**
 * 実施結果アイテム
 */
export interface AttemptResultItem {
  /** 問題ID */
  questionId: string;
  /** 問題番号 */
  number: number;
  /** 正誤 */
  isCorrect: boolean;
}

/**
 * 実施テーブル
 */
export interface AttemptTable {
  /** 実施ID (PK) */
  attemptId: string;
  /** テストID (GSI1 PK) */
  testId: string;
  /** 科目ID */
  subjectId: string;
  /** ステータス */
  status: 'IN_PROGRESS' | 'SUBMITTED';
  /** 開始日時 (GSI1 SK) */
  startedAt: string;
  /** 提出日時 */
  submittedAt?: string;
  /** 結果リスト */
  results: AttemptResultItem[];
}

/**
 * 採点済み用紙テーブル
 */
export interface GradedSheetTable {
  /** 採点済み用紙ID (PK) */
  gradedSheetId: string;
  /** テストID */
  testId: string;
  /** 科目ID */
  subjectId: string;
  /** 画像S3キー */
  imageS3Key: string;
  /** ステータス */
  status: 'UPLOADED' | 'ANALYZING' | 'DONE' | 'FAILED';
  /** AIプロバイダー */
  aiProvider: 'BEDROCK' | 'OPENAI' | 'GOOGLE';
  /** 結果リスト */
  results?: AttemptResultItem[];
  /** エラーメッセージ */
  errorMessage?: string;
}

/**
 * 単語テーブル
 */
export interface WordTable {
  /** 単語ID (PK) */
  wordId: string;
  /** 問題文 */
  question: string;
  /** 解答 */
  answer: string;
  /** 科目 */
  subject: string;
}

/**
 * 単語の「最後に間違えた日時」インデックス
 */
export interface WordIncorrectTable {
  /** 単語ID (PK) */
  wordId: string;
  /** 科目 (GSI1 PK) */
  subject: string;
  /** 最後に間違えた日時 (GSI1 SK) */
  lastIncorrectAt: string;
}

/**
 * 単語テストテーブル
 */
export interface WordTestTable {
  /** 単語テストID (PK) */
  wordTestId: string;
  /** 単語種別 */
  wordType: 'KANJI';
  /** 問題数 */
  count: number;
  /** 単語IDリスト */
  wordIds: string[];
  /** PDF S3キー */
  pdfS3Key?: string;
  /** テストID (表示用) */
  testId: string;
  /** 科目 */
  subject: string;
  /** ステータス */
  status: string;
}

/**
 * 単語テスト実施テーブル
 */
export interface WordTestAttemptTable {
  /** 単語テスト実施ID (PK) */
  wordTestAttemptId: string;
  /** 単語テストID (GSI1 PK) */
  wordTestId: string;
  /** ステータス */
  status: 'IN_PROGRESS' | 'SUBMITTED';
  /** 開始日時 (GSI1 SK) */
  startedAt: string;
  /** 提出日時 */
  submittedAt?: string;
  /** 結果リスト */
  results: { wordId: string; isCorrect: boolean }[];
}

/**
 * 試験用紙テーブル
 */
export interface ExamPaperTable {
  /** 用紙ID (PK) */
  paperId: string;
  /** 学年 */
  grade: string;
  /** 科目 */
  subject: string;
  /** カテゴリ */
  category: string;
  /** 名称 */
  name: string;
  /** 問題PDFパス */
  questionPdfPath: string;
  /** 解答PDFパス */
  answerPdfPath: string;
}

/**
 * 試験結果テーブル
 */
export interface ExamResultTable {
  /** 結果ID (PK) */
  resultId: string;
  /** 用紙ID */
  paperId: string;
  /** 学年 */
  grade: string;
  /** 科目 */
  subject: string;
  /** カテゴリ */
  category: string;
  /** 名称 */
  name: string;
  /** タイトル */
  title: string;
  /** 試験日 */
  testDate: string;
  /** 合計点 */
  totalScore: number;
  /** 詳細 */
  details: { number: number; isCorrect: boolean }[];
  /** 採点済み画像パス */
  gradedImagePath?: string;
}
