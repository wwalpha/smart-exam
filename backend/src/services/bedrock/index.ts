import type { AnalyzePaperResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { createAnalyzeExamPaper } from './analyzeExamPaper';

export type BedrockService = {
  analyzeExamPaper: (s3Key: string, subject: string) => Promise<AnalyzePaperResponse['questions']>;
};

const createBedrockService = (repositories: Repositories): BedrockService => {
  const analyzeExamPaper = createAnalyzeExamPaper(repositories);
  return { analyzeExamPaper };
};

export const bedrockService = createBedrockService;
