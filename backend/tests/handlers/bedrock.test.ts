import { describe, expect, it, vi } from 'vitest';
import { analyzePaper } from '@/handlers/bedrock';
import { BedrockRepository } from '@/repositories';
import { Request, Response } from 'express';

vi.mock('@/repositories');

describe('bedrock handler', () => {
  it('analyzePaper returns questions', async () => {
    const mockQuestions = ['1', '1-1'];
    vi.mocked(BedrockRepository.analyzeExamPaper).mockResolvedValue(mockQuestions as any);

    const req = {
      body: { s3Key: 'key', subject: 'sub' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await analyzePaper(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ questions: mockQuestions });
  });

  it('analyzePaper returns 400 if s3Key missing', async () => {
    const req = {
      body: { subject: 'sub' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await analyzePaper(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
