import { Question } from './material';

export type AnalyzePaperRequest = {
  s3Key: string;
  subject: string;
};

export type AnalyzePaperResponse = {
  questions: Question[];
};
