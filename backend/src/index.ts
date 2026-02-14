// Module: index responsibilities.

import serverlessExpress from '@vendia/serverless-express';
import { createApp } from '@/app/createApp';


const app = createApp();

/** Entry handler. */
export const handler = serverlessExpress({
  app,
  binarySettings: {
    contentTypes: ['application/pdf'],
  },
});
