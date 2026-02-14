import type { Repositories } from '@/repositories/createRepositories';
import { createBedrockService, type BedrockService } from '@/services/bedrock/createBedrockService';
import { createDashboardService, type DashboardService } from '@/services/dashboard/createDashboardService';
import { createKanjiService, type KanjiService } from '@/services/kanji/createKanjiService';
import {
  createKanjiQuestionsService,
  type KanjiQuestionsService,
} from '@/services/kanjiQuestions/createKanjiQuestionsService';
import { createMaterialsService, type MaterialsService } from '@/services/materials/createMaterialsService';
import { createQuestionsService, type QuestionsService } from '@/services/questions/createQuestionsService';
import {
  createReviewAttemptsService,
  type ReviewAttemptsService,
} from '@/services/reviewAttempts/createReviewAttemptsService';
import { createReviewTestsService, type ReviewTestsService } from '@/services/reviewTests/createReviewTestsService';
import { createS3Service, type S3Service } from '@/services/s3/createS3Service';

export type Services = {
  bedrock: BedrockService;
  dashboard: DashboardService;
  kanji: KanjiService;
  kanjiQuestions: KanjiQuestionsService;
  materials: MaterialsService;
  questions: QuestionsService;
  reviewAttempts: ReviewAttemptsService;
  reviewTests: ReviewTestsService;
  s3: S3Service;
};

export const createServices = (repositories: Repositories): Services => {
  return {
    bedrock: createBedrockService(repositories),
    dashboard: createDashboardService(),
    kanji: createKanjiService(repositories),
    kanjiQuestions: createKanjiQuestionsService(repositories),
    materials: createMaterialsService(repositories),
    questions: createQuestionsService(repositories),
    reviewAttempts: createReviewAttemptsService(repositories),
    reviewTests: createReviewTestsService(repositories),
    s3: createS3Service(repositories),
  };
};
