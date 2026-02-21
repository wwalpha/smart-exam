import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { AnalyzePaperRequest, AnalyzePaperResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { AnalyzePaperBodySchema } from './analyzePaper.schema';

/** Creates analyze paper controller. */
export const analyzePaperController = (services: Services) => {
  const analyzePaper: AsyncHandler<
    ParamsDictionary,
    AnalyzePaperResponse | { error: string },
    AnalyzePaperRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof AnalyzePaperBodySchema>;
    const { s3Key, subject } = body;
    const questions = await services.bedrock.analyzeExamPaper(s3Key, subject);
    res.json({ questions });
  };

  return { AnalyzePaperBodySchema, analyzePaper };
};
