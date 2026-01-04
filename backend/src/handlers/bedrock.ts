import type { Request, Response } from 'express';
import { analyzeExamPaper } from '@/services/BedrockService';
import { apiHandler } from '@/lib/handler';
import type { AnalyzePaperRequest, AnalyzePaperResponse } from '@smart-exam/api-types';

type AnalyzePaperReq = Request<{}, AnalyzePaperResponse | { error: string }, AnalyzePaperRequest>;
type AnalyzePaperRes = Response<AnalyzePaperResponse | { error: string }>;

export const analyzePaper = apiHandler(async (req: AnalyzePaperReq, res: AnalyzePaperRes) => {
  const { s3Key, subject } = req.body;
  if (!s3Key) {
    res.status(400).json({ error: 's3Key is required' });
    return;
  }
  const questions = await analyzeExamPaper(s3Key, subject);
  res.json({ questions });
});
