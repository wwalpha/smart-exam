import { describe, expect, it, vi } from 'vitest';
import { materialQuestionsController } from '@/controllers/materialQuestions';
import type { Services } from '@/services';
import { Request, Response } from 'express';
import type {
  CreateQuestionParams,
  CreateQuestionRequest,
  DeleteQuestionParams,
  ListQuestionsParams,
  SetQuestionChoiceParams,
  SetQuestionChoiceRequest,
  SearchQuestionsResponse,
  UpdateQuestionParams,
  UpdateQuestionRequest,
} from '@smart-exam/api-types';

// repository methods are spied per-test

describe('question handler', () => {
  it('listQuestions returns items', async () => {
    const mockItems = [{ id: '1', canonicalKey: '1-1' }];
    const services = {
      materialQuestions: {
        listQuestions: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = materialQuestionsController(services);

    const req = {
      params: { materialId: 'mat1' },
    } as unknown as Request<ListQuestionsParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.listQuestions(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ datas: mockItems });
  });

  it('createQuestion creates item', async () => {
    const mockItem = { id: '1', canonicalKey: '1-1' };
    const services = {
      materialQuestions: {
        createQuestion: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = materialQuestionsController(services);

    const req = {
      params: { materialId: 'mat1' },
      body: { canonicalKey: '1-1', subject: '4' },
    } as unknown as Request<CreateQuestionParams, unknown, CreateQuestionRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.createQuestion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('updateQuestion updates item', async () => {
    const mockItem = { id: '1', canonicalKey: '1-2' };
    const services = {
      materialQuestions: {
        updateQuestion: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = materialQuestionsController(services);

    const req = {
      params: { materialId: 'mat1', questionId: '1' },
      body: { canonicalKey: '1-2' },
    } as unknown as Request<UpdateQuestionParams, unknown, UpdateQuestionRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.updateQuestion(req, res, next);

    expect(services.materialQuestions.updateQuestion).toHaveBeenCalledWith('mat1', '1', { canonicalKey: '1-2' });
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('searchQuestions returns datas', async () => {
    const mockItems: SearchQuestionsResponse['datas'] = [
      {
        id: 'q1',
        subject: '4',
        unit: '',
        questionText: 'Q1',
        sourceMaterialId: 'm1',
        sourceMaterialName: '第1回',
      },
    ];

    const services = {
      materialQuestions: {
        searchQuestions: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = materialQuestionsController(services);

    const req = {
      body: { keyword: 'Q1', subject: '4' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.searchQuestions(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ datas: mockItems } satisfies SearchQuestionsResponse);
  });

  it('deleteQuestion returns 204', async () => {
    const services = {
      materialQuestions: {
        deleteQuestion: vi.fn().mockResolvedValue(true),
      },
    } as unknown as Services;

    const controller = materialQuestionsController(services);

    const req = {
      params: { materialId: 'mat1', questionId: 'q1' },
    } as unknown as Request<DeleteQuestionParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.deleteQuestion(req, res, next);

    expect(services.materialQuestions.deleteQuestion).toHaveBeenCalledWith('mat1', 'q1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('setQuestionChoice returns ok', async () => {
    const services = {
      materialQuestions: {
        setQuestionChoice: vi.fn().mockResolvedValue(true),
      },
    } as unknown as Services;

    const controller = materialQuestionsController(services);

    const req = {
      params: { materialId: 'mat1', questionId: 'q1' },
      body: { isCorrect: false },
    } as unknown as Request<SetQuestionChoiceParams, unknown, SetQuestionChoiceRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.setQuestionChoice(req, res, next);

    expect(services.materialQuestions.setQuestionChoice).toHaveBeenCalledWith({
      materialId: 'mat1',
      questionId: 'q1',
      isCorrect: false,
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
