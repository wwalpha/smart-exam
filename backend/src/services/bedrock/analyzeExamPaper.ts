import type { Repositories } from '@/repositories/createRepositories';

import type { BedrockService } from './createBedrockService';

export const createAnalyzeExamPaper = (repositories: Repositories): BedrockService['analyzeExamPaper'] => {
  return async (s3Key, subject) => {
    return await repositories.bedrock.analyzeExamPaper(s3Key, subject);
  };
};
