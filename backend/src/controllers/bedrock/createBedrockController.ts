import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod';

import type { AnalyzePaperRequest, AnalyzePaperResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const AnalyzePaperBodySchema = z.object({
  s3Key: z.string().min(1),
  subject: z.enum(['math', 'science', 'society']),
});

export const createBedrockController = (services: Services) => {
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
