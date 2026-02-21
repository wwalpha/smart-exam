import { describe, expect, it, vi } from 'vitest';
import {
  createExamController,
  getExamController,
  listExamTargetsController,
  listExamsController,
} from '@/controllers/exam';
import type { Services } from '@/services';
import { Request, Response } from 'express';
import type { CreateExamRequest, GetExamParams } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('exam handler', () => {
  it('listExams returns items', async () => {
    const mockItems = [{ id: '1', status: 'IN_PROGRESS' }];
    const services = {
      exams: {
        listExams: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = {
      ...listExamsController(services),
      ...createExamController(services),
      ...getExamController(services),
      ...listExamTargetsController(services),
    };

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.listExams(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createExam creates item', async () => {
    const mockItem = { id: '1', status: 'IN_PROGRESS' };
    const services = {
      exams: {
        createExam: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = {
      ...listExamsController(services),
      ...createExamController(services),
      ...getExamController(services),
      ...listExamTargetsController(services),
    };

    const req = {
      body: { subject: '1', mode: 'MATERIAL', count: 20 },
    } as unknown as Request<Record<string, never>, unknown, CreateExamRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.createExam(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('getExam returns item', async () => {
    const mockItem = { id: '1', status: 'IN_PROGRESS', items: [] };
    const services = {
      exams: {
        getExam: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = {
      ...listExamsController(services),
      ...createExamController(services),
      ...getExamController(services),
      ...listExamTargetsController(services),
    };

    const req = {
      params: { testId: '1' },
    } as unknown as Request<GetExamParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.getExam(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('listExamTargets returns items', async () => {
    const mockTargets = [
      { targetType: 'MATERIAL', targetId: 'q1', subject: '1', lastTestCreatedDate: '2026-01-01', includedCount: 2 },
    ];
    const services = {
      exams: {
        listExamTargets: vi.fn().mockResolvedValue(mockTargets as unknown),
      },
    } as unknown as Services;

    const controller = {
      ...listExamsController(services),
      ...createExamController(services),
      ...getExamController(services),
      ...listExamTargetsController(services),
    };

    const req = {
      validated: {
        query: { mode: 'MATERIAL', from: '2026-01-01', to: '2026-01-31', subject: undefined },
      },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.listExamTargets(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockTargets });
  });
});
