import { BedrockRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { AnalyzePaperRequest, AnalyzePaperResponse } from '@smart-exam/api-types';

const normalizeSubjectForPrompt = (subject: AnalyzePaperRequest['subject']): string => {
  if (subject === '2') return 'science';
  if (subject === '3') return 'society';
  if (subject === '4') return 'math';
  return 'math';
};

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
  const questions = await BedrockRepository.analyzeExamPaper(s3Key, normalizeSubjectForPrompt(subject));
  res.json({ questions });
};
