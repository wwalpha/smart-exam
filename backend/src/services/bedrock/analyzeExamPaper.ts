import type { Repositories } from '@/repositories/createRepositories';

import type { BedrockService } from './createBedrockService';

// 公開するサービス処理を定義する
export const createAnalyzeExamPaper = (repositories: Repositories): BedrockService['analyzeExamPaper'] => {
  // 処理結果を呼び出し元へ返す
  return async (s3Key, subject) => {
    // 処理結果を呼び出し元へ返す
    return await repositories.bedrock.analyzeExamPaper(s3Key, subject);
  };
};
