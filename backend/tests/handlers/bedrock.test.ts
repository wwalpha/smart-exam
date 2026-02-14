import { describe, expect, it, vi } from 'vitest';
import { AnalyzePaperBodySchema, analyzePaperController } from '@/controllers/bedrock';
import type { Services } from '@/services';
import { Request, Response } from 'express';
import { validateBody } from '@/middlewares/validateZod';

// repository methods are spied per-test

describe('bedrock handler', () => {
  it('analyzePaper returns questions', async () => {
    const mockQuestions = ['1', '1-1'];

    const services = {
      bedrock: {
        analyzeExamPaper: vi.fn().mockResolvedValue(mockQuestions),
      },
    } as unknown as Services;

    const controller = analyzePaperController(services);

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

    await controller.analyzePaper(req, res, next);

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
