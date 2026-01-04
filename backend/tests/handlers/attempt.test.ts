import { describe, expect, it, vi } from 'vitest';
import { createAttempt, submitAttempt, getLatestAttempt } from '@/handlers/attempt';
import { AttemptsRepository } from '@/repositories/attemptRepository';
import { Request, Response } from 'express';

vi.mock('@/repositories/attemptRepository');

describe('attempt handler', () => {
  it('createAttempt creates item', async () => {
    const mockItem = { attemptId: '1', status: 'IN_PROGRESS' };
    vi.mocked(AttemptsRepository.createAttempt).mockResolvedValue(mockItem as any);

    const req = {
      params: { testId: 'test1' },
      body: { subjectId: 'sub1' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createAttempt(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('submitAttempt submits item', async () => {
    const mockItem = { attemptId: '1', status: 'SUBMITTED' };
    vi.mocked(AttemptsRepository.submitAttempt).mockResolvedValue(mockItem as any);

    const req = {
      params: { attemptId: '1' },
      body: { results: [] },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await submitAttempt(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('getLatestAttempt returns item', async () => {
    const mockItem = { attemptId: '1', status: 'IN_PROGRESS' };
    vi.mocked(AttemptsRepository.getLatestAttempt).mockResolvedValue(mockItem as any);

    const req = {
      params: { testId: 'test1' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await getLatestAttempt(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
