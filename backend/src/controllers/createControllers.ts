import * as BedrockController from '@/controllers/bedrock';
import * as DashboardController from '@/controllers/dashboard';
import * as KanjiController from '@/controllers/kanji';
import * as MaterialsController from '@/controllers/materials';
import * as QuestionsController from '@/controllers/questions';
import * as ReviewAttemptsController from '@/controllers/reviewAttempts';
import * as ReviewTestsController from '@/controllers/reviewTests';
import * as S3Controller from '@/controllers/s3';

import type { Services } from '@/services/createServices';

export type Controllers = {
  bedrock: typeof BedrockController;
  dashboard: typeof DashboardController;
  kanji: typeof KanjiController;
  materials: typeof MaterialsController;
  questions: typeof QuestionsController;
  reviewAttempts: typeof ReviewAttemptsController;
  reviewTests: typeof ReviewTestsController;
  s3: typeof S3Controller;
};

// 現時点では controller module 側が直接サービス層を import しているため、
// DI の骨格だけ先に導入し、段階的に controller factory 化する。
export const createControllers = (_services: Services): Controllers => {
  return {
    bedrock: BedrockController,
    dashboard: DashboardController,
    kanji: KanjiController,
    materials: MaterialsController,
    questions: QuestionsController,
    reviewAttempts: ReviewAttemptsController,
    reviewTests: ReviewTestsController,
    s3: S3Controller,
  };
};
