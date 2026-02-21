// Module: createControllers responsibilities.

import { analyzePaperController } from '@/controllers/bedrock';
import { getDashboardController } from '@/controllers/dashboard';
import { listExamAttemptsController } from '@/controllers/examAttempts';
import { kanjiController } from '@/controllers/kanji';
import { materialsController } from '@/controllers/materials';
import { materialQuestionsController } from '@/controllers/materialQuestions';
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
  materialQuestions: ReturnType<typeof materialQuestionsController>;
  examAttempts: ReturnType<typeof listExamAttemptsController>;
  reviewAttempts: ReturnType<typeof listExamAttemptsController>;
  examCandidates: ReturnType<typeof examCandidatesController>;
  exams: {
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
    materialQuestions: materialQuestionsController(services),
    examAttempts: listExamAttemptsController(services),
    reviewAttempts: listExamAttemptsController(services),
    examCandidates: examCandidatesController(services),
    exams: {
      kanji: kanjiTestsController(services),
      question: questionTestsController(services),
    },
    s3: getUploadUrlController(services),
  };
};
