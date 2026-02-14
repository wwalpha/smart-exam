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
  // 処理で使う値を準備する
  const analyzeExamPaper = createAnalyzeExamPaper(repositories);

  // 処理結果を呼び出し元へ返す
  return { analyzeExamPaper };
};
