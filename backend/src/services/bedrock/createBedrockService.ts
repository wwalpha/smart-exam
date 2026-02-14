// Module: createBedrockService responsibilities.

import type { AnalyzePaperResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { createAnalyzeExamPaper } from './analyzeExamPaper';

/** Type definition for BedrockService. */
export type BedrockService = {
  analyzeExamPaper: (s3Key: string, subject: string) => Promise<AnalyzePaperResponse['questions']>;
};

/** Creates bedrock service. */
export const createBedrockService = (repositories: Repositories): BedrockService => {
  const analyzeExamPaper = createAnalyzeExamPaper(repositories);

  return { analyzeExamPaper };
};
