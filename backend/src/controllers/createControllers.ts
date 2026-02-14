// Module: createControllers responsibilities.

import { analyzePaperController } from '@/controllers/bedrock';
import { getDashboardController } from '@/controllers/dashboard';
import { kanjiController } from '@/controllers/kanji';
import { materialsController } from '@/controllers/materials';
import { questionsController } from '@/controllers/questions';
import { listReviewAttemptsController } from '@/controllers/reviewAttempts';
import { examCandidatesController } from '@/controllers/examCandidates';
import { getUploadUrlController } from '@/controllers/s3';
import { kanjiTestsController, questionTestsController } from '@/controllers/tests';

import type { Services } from '@/services/createServices';

/** Type definition for Controllers. */
export type Controllers = {
  bedrock: ReturnType<typeof analyzePaperController>;
  dashboard: ReturnType<typeof getDashboardController>;
  kanji: ReturnType<typeof kanjiController>;
  materials: ReturnType<typeof materialsController>;
  questions: ReturnType<typeof questionsController>;
  reviewAttempts: ReturnType<typeof listReviewAttemptsController>;
  examCandidates: ReturnType<typeof examCandidatesController>;
  tests: {
    kanji: ReturnType<typeof kanjiTestsController>;
    question: ReturnType<typeof questionTestsController>;
  };
  s3: ReturnType<typeof getUploadUrlController>;
};

/** Creates controllers. */
export const createControllers = (services: Services): Controllers => {
  return {
    bedrock: analyzePaperController(services),
    dashboard: getDashboardController(services),
    kanji: kanjiController(services),
    materials: materialsController(services),
    questions: questionsController(services),
    reviewAttempts: listReviewAttemptsController(services),
    examCandidates: examCandidatesController(services),
    tests: {
      kanji: kanjiTestsController(services),
      question: questionTestsController(services),
    },
    s3: getUploadUrlController(services),
  };
};
