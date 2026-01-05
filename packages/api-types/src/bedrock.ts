import type { SubjectId } from './subject';

export type AnalyzePaperRequest = {
  s3Key: string;
  subject: SubjectId;
};

export type AnalyzePaperResponse = {
  questions: string[];
};
