export type AnalyzePaperRequest = {
  /** 解析対象ファイルのS3キー */
  s3Key: string;
  /** 解析対象の科目 */
  subject: 'math' | 'science' | 'society';
};

export type AnalyzePaperResponse = {
  /** 抽出された設問の文字列一覧 */
  questions: string[];
};
