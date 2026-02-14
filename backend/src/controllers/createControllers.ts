// Module: createControllers responsibilities.

import { analyzePaperController } from '@/controllers/bedrock';
import { getDashboardController } from '@/controllers/dashboard';
import { kanjiController } from '@/controllers/kanji';
import { generateReadingController } from '@/controllers/kanjiQuestions';
import { materialsController } from '@/controllers/materials';
import { questionsController } from '@/controllers/questions';
import { listReviewAttemptsController } from '@/controllers/reviewAttempts';
import { reviewTestCandidatesController } from '@/controllers/reviewTestCandidates';
import {
  createReviewTestController,
  deleteReviewTestController,
  getReviewTestController,
  getReviewTestPdfController,
  listReviewTestTargetsController,
  listReviewTestsController,
  searchReviewTestsController,
  submitReviewTestResultsController,
  updateReviewTestStatusController,
} from '@/controllers/reviewTests';
import { getUploadUrlController } from '@/controllers/s3';

import type { Services } from '@/services/createServices';

/** Type definition for Controllers. */
export type Controllers = {
  bedrock: ReturnType<typeof analyzePaperController>;
  dashboard: ReturnType<typeof getDashboardController>;
  kanji: ReturnType<typeof kanjiController>;
  kanjiQuestions: ReturnType<typeof generateReadingController>;
  materials: ReturnType<typeof materialsController>;
  questions: ReturnType<typeof questionsController>;
  reviewAttempts: ReturnType<typeof listReviewAttemptsController>;
  reviewTestCandidates: ReturnType<typeof reviewTestCandidatesController>;
  reviewTests: ReturnType<typeof listReviewTestsController> &
    ReturnType<typeof searchReviewTestsController> &
    ReturnType<typeof createReviewTestController> &
    ReturnType<typeof getReviewTestController> &
    ReturnType<typeof getReviewTestPdfController> &
    ReturnType<typeof updateReviewTestStatusController> &
    ReturnType<typeof deleteReviewTestController> &
    ReturnType<typeof submitReviewTestResultsController> &
    ReturnType<typeof listReviewTestTargetsController>;
  s3: ReturnType<typeof getUploadUrlController>;
};

/** Creates controllers. */
export const createControllers = (services: Services): Controllers => {
  return {
    bedrock: analyzePaperController(services),
    dashboard: getDashboardController(services),
    kanji: kanjiController(services),
    kanjiQuestions: {
      ...generateReadingController(services),
    },
    materials: materialsController(services),
    questions: questionsController(services),
    reviewAttempts: listReviewAttemptsController(services),
    reviewTestCandidates: reviewTestCandidatesController(services),
    reviewTests: {
      ...listReviewTestsController(services),
      ...searchReviewTestsController(services),
      ...createReviewTestController(services),
      ...getReviewTestController(services),
      ...getReviewTestPdfController(services),
      ...updateReviewTestStatusController(services),
      ...deleteReviewTestController(services),
      ...submitReviewTestResultsController(services),
      ...listReviewTestTargetsController(services),
    },
    s3: getUploadUrlController(services),
  };
};
