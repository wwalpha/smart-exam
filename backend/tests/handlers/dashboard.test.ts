import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { getDashboard } from '@/handlers/dashboard';
import { DashboardRepository } from '@/repositories/dashboardRepository';
import type { DashboardData } from '@smart-exam/api-types';

vi.mock('@/repositories/dashboardRepository');

describe('dashboard handler', () => {
  it('getDashboard returns DashboardData shape', async () => {
    const mockData: DashboardData = {
      todayTestCount: 1,
      topIncorrectQuestions: [
        {
          id: 'q1',
          displayLabel: 'Q1',
          incorrectRate: 1,
          subject: 'math',
        },
      ],
      topIncorrectKanji: [],
      lockedCount: 0,
      inventoryCount: 0,
    };

    vi.mocked(DashboardRepository.getDashboardData).mockResolvedValue(mockData);

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
