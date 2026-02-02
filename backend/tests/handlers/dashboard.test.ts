import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { createDashboardController } from '@/controllers/dashboard/createDashboardController';
import type { Services } from '@/services';
import type { DashboardData } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('dashboard handler', () => {
  it('getDashboard returns DashboardData shape', async () => {
    const mockData: DashboardData = {
      todayTestCount: 1,
      topIncorrectQuestions: [
        {
          id: 'q1',
          displayLabel: 'Q1',
          incorrectRate: 1,
          subject: '4',
        },
      ],
      lockedCount: 0,
      inventoryCount: 0,
    };

    const services = {
      dashboard: {
        getDashboardData: vi.fn().mockResolvedValue(mockData),
      },
    } as unknown as Services;

    const controller = createDashboardController(services);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.getDashboard(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        todayTestCount: 1,
        topIncorrectQuestions: expect.any(Array),
        lockedCount: 0,
        inventoryCount: 0,
      }),
    );
  });
});
