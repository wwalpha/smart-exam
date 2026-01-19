import type { AnalyzePaperResponse } from '@smart-exam/api-types';
import { analyzeExamPaper as analyzeExamPaperService } from '@/services/BedrockService';

export const analyzeExamPaper = async (s3Key: string, subject: string): Promise<AnalyzePaperResponse['questions']> => {
  return analyzeExamPaperService(s3Key, subject);
};
