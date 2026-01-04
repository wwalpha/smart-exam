export type AnalyzePaperRequest = {
  s3Key: string;
  subject: string;
};

export type AnalyzePaperResponse = {
  questions: string[];
};
