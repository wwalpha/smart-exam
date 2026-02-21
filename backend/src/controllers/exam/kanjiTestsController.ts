import { EXAM_MODE } from '@smart-exam/api-types';

import type { Services } from '@/services/createServices';

import { createModeScopedExamsController } from './createModeScopedExamsController';

export const kanjiTestsController = (services: Services) => {
  return createModeScopedExamsController(services, EXAM_MODE.KANJI);
};