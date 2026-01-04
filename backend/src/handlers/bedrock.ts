// import { analyzeExamPaper } from '../services/BedrockService';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { AnalyzePaperRequest, AnalyzePaperResponse } from '@smart-exam/api-types';

export const analyzePaper: AsyncHandler<
  ParamsDictionary,
  AnalyzePaperResponse | { error: string },
  AnalyzePaperRequest,
  ParsedQs
> = async (req, res) => {
  const { s3Key, subject } = req.body;
  if (!s3Key) {
    res.status(400).json({ error: 's3Key is required' });
    return;
  }
  // const questions = await analyzeExamPaper(s3Key, subject);
  res.json({ questions: [] });
};
