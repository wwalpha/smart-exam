import type { Repositories } from '@/repositories/createRepositories';

import type { BedrockService } from './index';

export const createAnalyzeExamPaper = (repositories: Repositories): BedrockService['analyzeExamPaper'] => {
  return (async (
    ...args: Parameters<BedrockService['analyzeExamPaper']>
  ): Promise<ReturnType<BedrockService['analyzeExamPaper']> extends Promise<infer T> ? T : never> => {
    return repositories.bedrock.analyzeExamPaper(...args);
  }) as BedrockService['analyzeExamPaper'];
};
