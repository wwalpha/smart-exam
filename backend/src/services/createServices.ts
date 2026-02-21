import type { Repositories } from '@/repositories/createRepositories';
import { bedrockService } from '@/services/bedrock';
import { dashboardService } from '@/services/dashboard';
import { kanjiService } from '@/services/kanji';
import { materialQuestionsService } from '@/services/materialQuestions';
import { materialsService } from '@/services/materials';
import { examAttemptsService } from '@/services/examAttempts';
import { examsService } from '@/services/exam';
import { s3Service } from '@/services/s3';
import type { Services } from './createServices.types';

export type { Services } from './createServices.types';

// 公開するサービス処理を定義する
export const createServices = (repositories: Repositories): Services => {
  // 処理結果を呼び出し元へ返す
  return {
    bedrock: bedrockService(repositories),
    dashboard: dashboardService(),
    kanji: kanjiService(repositories),
    materialQuestions: materialQuestionsService(repositories),
    materials: materialsService(repositories),
    examAttempts: examAttemptsService(repositories),
    reviewAttempts: examAttemptsService(repositories),
    exams: examsService(repositories),
    s3: s3Service(repositories),
  };
};
