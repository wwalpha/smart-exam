import { createBedrockController } from '@/controllers/bedrock/createBedrockController';
import { createDashboardController } from '@/controllers/dashboard/createDashboardController';
import { createKanjiController } from '@/controllers/kanji/createKanjiController';
import { createMaterialsController } from '@/controllers/materials/createMaterialsController';
import { createQuestionsController } from '@/controllers/questions/createQuestionsController';
import { createReviewAttemptsController } from '@/controllers/reviewAttempts/createReviewAttemptsController';
import { createReviewTestsController } from '@/controllers/reviewTests/createReviewTestsController';
import { createS3Controller } from '@/controllers/s3/createS3Controller';

import type { Services } from '@/services/createServices';

export type Controllers = {
  bedrock: ReturnType<typeof createBedrockController>;
  dashboard: ReturnType<typeof createDashboardController>;
  kanji: ReturnType<typeof createKanjiController>;
  materials: ReturnType<typeof createMaterialsController>;
  questions: ReturnType<typeof createQuestionsController>;
  reviewAttempts: ReturnType<typeof createReviewAttemptsController>;
  reviewTests: ReturnType<typeof createReviewTestsController>;
  s3: ReturnType<typeof createS3Controller>;
};

export const createControllers = (services: Services): Controllers => {
  return {
    bedrock: createBedrockController(services),
    dashboard: createDashboardController(services),
    kanji: createKanjiController(services),
    materials: createMaterialsController(services),
    questions: createQuestionsController(services),
    reviewAttempts: createReviewAttemptsController(services),
    reviewTests: createReviewTestsController(services),
    s3: createS3Controller(services),
  };
};
