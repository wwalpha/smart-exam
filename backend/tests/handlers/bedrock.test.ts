import { describe, expect, it, vi } from 'vitest';
import { AnalyzePaperBodySchema, analyzePaper } from '@/controllers/bedrock';
import { BedrockRepository } from '@/services';
import { Request, Response } from 'express';
import { validateBody } from '@/middlewares/validateZod';

// repository methods are spied per-test

describe('bedrock handler', () => {
  it('analyzePaper returns questions', async () => {
    const mockQuestions = ['1', '1-1'];
    vi.spyOn(BedrockRepository, 'analyzeExamPaper').mockResolvedValue(mockQuestions as any);

    const req = {
      body: { s3Key: 'key', subject: 'math' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    const mw = validateBody(AnalyzePaperBodySchema);
    mw(req, res, next);
    expect(next).toHaveBeenCalled();

    await analyzePaper(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ questions: mockQuestions });
  });

  it('analyzePaper returns 400 if s3Key missing', async () => {
    const req = {
      body: { subject: 'math' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    const mw = validateBody(AnalyzePaperBodySchema);
    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
