import { describe, expect, it, vi } from 'vitest';
import { listReviewTests, createReviewTest, getReviewTest } from '@/handlers/reviewTest';
import { ReviewTestRepository } from '@/repositories';
import { Request, Response } from 'express';
import type { CreateReviewTestRequest, GetReviewTestParams } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('reviewTest handler', () => {
  it('listReviewTests returns items', async () => {
    const mockItems = [{ id: '1', status: 'IN_PROGRESS' }];
    vi.spyOn(ReviewTestRepository, 'listReviewTests').mockResolvedValue(mockItems as any);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await listReviewTests(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createReviewTest creates item', async () => {
    const mockItem = { id: '1', status: 'IN_PROGRESS' };
    vi.spyOn(ReviewTestRepository, 'createReviewTest').mockResolvedValue(mockItem as any);

    const req = {
      body: { subject: 'sub1' },
    } as Request<Record<string, never>, unknown, CreateReviewTestRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createReviewTest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('getReviewTest returns item', async () => {
    const mockItem = { id: '1', status: 'IN_PROGRESS', items: [] };
    vi.spyOn(ReviewTestRepository, 'getReviewTest').mockResolvedValue(mockItem as any);

    const req = {
      params: { testId: '1' },
    } as unknown as Request<GetReviewTestParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await getReviewTest(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
