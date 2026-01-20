import type { AnalyzePaperResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

export type BedrockService = {
  analyzeExamPaper: (s3Key: string, subject: string) => Promise<AnalyzePaperResponse['questions']>;
};

export const createBedrockService = (repositories: Repositories): BedrockService => {
  const analyzeExamPaper: BedrockService['analyzeExamPaper'] = async (s3Key, subject) => {
    return await repositories.bedrock.analyzeExamPaper(s3Key, subject);
  };

  return { analyzeExamPaper };
};
