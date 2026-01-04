import { describe, expect, it, vi } from 'vitest';
import { listExamPapers, createExamPaper } from '@/handlers/examPaper';
import { ExamPapersRepository } from '@/repositories';
import { Request, Response } from 'express';

// repository methods are spied per-test

describe('examPaper handler', () => {
  it('listExamPapers returns papers', async () => {
    const mockPapers = [{ paperId: '1', name: 'Test Paper' }];
    vi.spyOn(ExamPapersRepository, 'listExamPapers').mockResolvedValue(mockPapers as any);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await listExamPapers(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ datas: mockPapers });
  });

  it('createExamPaper creates paper', async () => {
    const mockPaper = { paperId: '1', name: 'Test Paper' };
    vi.spyOn(ExamPapersRepository, 'createExamPaper').mockResolvedValue(mockPaper as any);

    const req = {
      body: { name: 'Test Paper' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createExamPaper(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockPaper);
  });
});
