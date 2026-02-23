// Module: createControllers responsibilities.

import { analyzePaperController } from '@/controllers/bedrock';
import { getDashboardController } from '@/controllers/dashboard';
import { kanjiController } from '@/controllers/kanji';
import { materialsController } from '@/controllers/materials';
import { materialQuestionsController } from '@/controllers/materialQuestions';
import { examsController } from '@/controllers/exam';

import type { Services } from '@/services/createServices';

/** Type definition for Controllers. */
export type Controllers = {
  bedrock: ReturnType<typeof analyzePaperController>;
  dashboard: ReturnType<typeof getDashboardController>;
  kanji: ReturnType<typeof kanjiController>;
  materials: ReturnType<typeof materialsController>;
  materialQuestions: ReturnType<typeof materialQuestionsController>;
  exams: ReturnType<typeof examsController>;
};

/** Creates controllers. */
export const createControllers = (services: Services): Controllers => {
  return {
    bedrock: analyzePaperController(services),
    dashboard: getDashboardController(services),
    kanji: kanjiController(services),
    materials: materialsController(services),
    materialQuestions: materialQuestionsController(services),
    exams: examsController(services),
  };
};
