import { describe, expect, it, vi } from 'vitest';
import { listQuestions, createQuestion, updateQuestion } from '@/handlers/question';
import { QuestionRepository } from '@/repositories/questionRepository';
import { Request, Response } from 'express';

vi.mock('@/repositories/questionRepository');

describe('question handler', () => {
  it('listQuestions returns items', async () => {
    const mockItems = [{ id: '1', displayLabel: 'Q1' }];
    vi.mocked(QuestionRepository.listQuestions).mockResolvedValue(mockItems as any);

    const req = {
      params: { materialSetId: 'mat1' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await listQuestions(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ datas: mockItems });
  });

  it('createQuestion creates item', async () => {
    const mockItem = { id: '1', displayLabel: 'Q1' };
    vi.mocked(QuestionRepository.createQuestion).mockResolvedValue(mockItem as any);

    const req = {
      params: { materialSetId: 'mat1' },
      body: { displayLabel: 'Q1' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createQuestion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('updateQuestion updates item', async () => {
    const mockItem = { id: '1', displayLabel: 'Q1-updated' };
    vi.mocked(QuestionRepository.updateQuestion).mockResolvedValue(mockItem as any);

    const req = {
      params: { questionId: '1' },
      body: { displayLabel: 'Q1-updated' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await updateQuestion(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
