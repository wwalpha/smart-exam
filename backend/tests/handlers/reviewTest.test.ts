import { describe, expect, it, vi } from 'vitest';
import { createReviewTestsController } from '@/controllers/reviewTests/createReviewTestsController';
import type { Services } from '@/services';
import { Request, Response } from 'express';
import type { CreateReviewTestRequest, GetReviewTestParams } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('reviewTest handler', () => {
  it('listReviewTests returns items', async () => {
    const mockItems = [{ id: '1', status: 'IN_PROGRESS' }];
    const services = {
      reviewTests: {
        listReviewTests: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = createReviewTestsController(services);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.listReviewTests(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createReviewTest creates item', async () => {
    const mockItem = { id: '1', status: 'IN_PROGRESS' };
    const services = {
      reviewTests: {
        createReviewTest: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = createReviewTestsController(services);

    const req = {
      body: { subject: '1', mode: 'QUESTION', count: 20 },
    } as unknown as Request<Record<string, never>, unknown, CreateReviewTestRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.createReviewTest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('getReviewTest returns item', async () => {
    const mockItem = { id: '1', status: 'IN_PROGRESS', items: [] };
    const services = {
      reviewTests: {
        getReviewTest: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = createReviewTestsController(services);

    const req = {
      params: { testId: '1' },
    } as unknown as Request<GetReviewTestParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.getReviewTest(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('listReviewTestTargets returns items', async () => {
    const mockTargets = [
      { targetType: 'QUESTION', targetId: 'q1', subject: '1', lastTestCreatedDate: '2026-01-01', includedCount: 2 },
    ];
    const services = {
      reviewTests: {
        listReviewTestTargets: vi.fn().mockResolvedValue(mockTargets as unknown),
      },
    } as unknown as Services;

    const controller = createReviewTestsController(services);

    const req = {
      validated: {
        query: { mode: 'QUESTION', from: '2026-01-01', to: '2026-01-31', subject: undefined },
      },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.listReviewTestTargets(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockTargets });
  });
});
