import type { AnalyzePaperResponse } from '@smart-exam/api-types';
import { analyzeExamPaper } from '../services/BedrockService';

export const BedrockRepository = {
  analyzeExamPaper: async (s3Key: string, subject: string): Promise<AnalyzePaperResponse['questions']> => {
    return analyzeExamPaper(s3Key, subject);
  },
};
