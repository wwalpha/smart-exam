import { describe, expect, it, vi } from 'vitest';
import { candidateController } from '@/controllers/candidate';
import type { Services } from '@/services';
import { Request, Response } from 'express';
import type { CandidateSearchResponse } from '@smart-exam/api-types';

describe('candidate handler', () => {
  it('candidateSearch returns datas', async () => {
    const mockItems: CandidateSearchResponse['datas'] = [
      {
        id: 'q1',
        subject: '4',
        nextTime: '2026-03-15',
        mode: 'MATERIAL',
        questionText: 'Q1',
      },
    ];

    const services = {
      candidates: {
        candidateSearch: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = candidateController(services);

    const req = {
      body: { subject: '4', mode: 'MATERIAL', nextTime: '2026-03-15' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.candidateSearch(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ datas: mockItems } satisfies CandidateSearchResponse);
  });
});