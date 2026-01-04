import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { getDashboard } from '@/handlers/dashboard';
import { AttemptsService } from '@/services/AttemptsService';
import { QuestionsService } from '@/services/QuestionsService';

vi.mock('@/services/AttemptsService');
vi.mock('@/services/QuestionsService');

describe('dashboard handler', () => {
  it('getDashboard returns DashboardData shape', async () => {
    vi.mocked(AttemptsService.scanAll).mockResolvedValue([
      {
        attemptId: 'a1',
        testId: 't1',
        subjectId: 'math',
        status: 'SUBMITTED',
        startedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        results: [
          { questionId: 'q1', number: 1, isCorrect: false },
          { questionId: 'q2', number: 2, isCorrect: true },
        ],
      },
    ] as any);

    vi.mocked(QuestionsService.scanAll).mockResolvedValue([
      {
        questionId: 'q1',
        testId: 't1',
        subjectId: 'math',
        number: 1,
        canonicalKey: 'Q1',
        displayLabel: 'Q1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        questionId: 'q2',
        testId: 't1',
        subjectId: 'math',
        number: 2,
        canonicalKey: 'Q2',
        displayLabel: 'Q2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as any);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await getDashboard(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        todayTestCount: 1,
        topIncorrectQuestions: expect.any(Array),
        topIncorrectKanji: expect.any(Array),
        lockedCount: 0,
        inventoryCount: 0,
      })
    );
  });
});
