import type { Repositories } from '@/repositories/createRepositories';
import { bedrockService, type BedrockService } from '@/services/bedrock';
import { dashboardService, type DashboardService } from '@/services/dashboard';
import { kanjiService, type KanjiService } from '@/services/kanji';
import { materialsService, type MaterialsService } from '@/services/materials';
import { questionsService, type QuestionsService } from '@/services/questions';
import { reviewAttemptsService, type ReviewAttemptsService } from '@/services/reviewAttempts';
import { examsService, type ExamsService } from '@/services/exam';
import { s3Service, type S3Service } from '@/services/s3';

export type Services = {
  bedrock: BedrockService;
  dashboard: DashboardService;
  kanji: KanjiService;
  materials: MaterialsService;
  questions: QuestionsService;
  reviewAttempts: ReviewAttemptsService;
  exams: ExamsService;
  s3: S3Service;
};

export const createServices = (repositories: Repositories): Services => {
  return {
    bedrock: bedrockService(repositories),
    dashboard: dashboardService(),
    kanji: kanjiService(repositories),
    materials: materialsService(repositories),
    questions: questionsService(repositories),
    reviewAttempts: reviewAttemptsService(repositories),
    exams: examsService(repositories),
    s3: s3Service(repositories),
  };
};
