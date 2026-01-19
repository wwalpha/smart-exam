import { BedrockRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { AnalyzePaperRequest, AnalyzePaperResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

export const AnalyzePaperBodySchema = z.object({
  s3Key: z.string().min(1),
  subject: z.enum(['math', 'science', 'society']),
});

export const analyzePaper: AsyncHandler<
  ParamsDictionary,
  AnalyzePaperResponse | { error: string },
  AnalyzePaperRequest,
  ParsedQs
> = async (req, res) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof AnalyzePaperBodySchema>;
  const { s3Key, subject } = body;
  const questions = await BedrockRepository.analyzeExamPaper(s3Key, subject);
  res.json({ questions });
};
