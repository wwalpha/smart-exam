import type { Repositories } from '@/repositories/createRepositories';

import type { BedrockService } from './index';

const analyzeExamPaperImpl = async (
  repositories: Repositories,
  ...args: Parameters<BedrockService['analyzeExamPaper']>
): Promise<ReturnType<BedrockService['analyzeExamPaper']> extends Promise<infer T> ? T : never> => {
  return repositories.bedrock.analyzeExamPaper(...args);
};

export const createAnalyzeExamPaper = (repositories: Repositories): BedrockService['analyzeExamPaper'] => {
  return analyzeExamPaperImpl.bind(null, repositories) as BedrockService['analyzeExamPaper'];
};
