import { REVIEW_MODE } from '@smart-exam/api-types';

import type { Services } from '@/services/createServices';

import { createModeScopedTestsController } from './createModeScopedTestsController';

export const questionTestsController = (services: Services) => {
  return createModeScopedTestsController(services, REVIEW_MODE.QUESTION);
};
