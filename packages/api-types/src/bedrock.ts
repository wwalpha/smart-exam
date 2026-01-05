export type AnalyzePaperRequest = {
  s3Key: string;
  subject: 'math' | 'science' | 'society';
};

export type AnalyzePaperResponse = {
  questions: string[];
};
