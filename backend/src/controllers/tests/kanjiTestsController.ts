import { REVIEW_MODE } from '@smart-exam/api-types';

import type { Services } from '@/services/createServices';

import { createModeScopedTestsController } from './createModeScopedTestsController';

export const kanjiTestsController = (services: Services) => {
  return createModeScopedTestsController(services, REVIEW_MODE.KANJI);
};
