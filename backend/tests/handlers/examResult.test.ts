import { describe, expect, it, vi } from 'vitest';
import { listExamResults, createExamResult } from '@/handlers/examResult';
import { ExamResultsRepository } from '@/repositories';
import { Request, Response } from 'express';

// repository methods are spied per-test

describe('examResult handler', () => {
  it('listExamResults returns results', async () => {
    const mockResults = [{ resultId: '1', title: 'Test Result' }];
    vi.spyOn(ExamResultsRepository, 'listExamResults').mockResolvedValue(mockResults as any);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await listExamResults(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ datas: mockResults });
  });

  it('createExamResult creates result', async () => {
    const mockResult = { resultId: '1', title: 'Test Result' };
    vi.spyOn(ExamResultsRepository, 'createExamResult').mockResolvedValue(mockResult as any);

    const req = {
      body: { title: 'Test Result' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createExamResult(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
});
