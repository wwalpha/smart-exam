import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

describe('createGetExam', () => {
  it('returns material question correctAnswer as answerText and correctAnswer', async () => {
    const { createGetExam } = await import('@/services/exam/getExam');

    const repositories = {
      exams: {
        get: vi.fn().mockResolvedValue({
          examId: 'e1',
          subject: '4',
          mode: 'MATERIAL',
          status: 'IN_PROGRESS',
          count: 1,
          createdDate: '2026-04-04',
          results: [],
        }),
      },
      examDetails: {
        listByExamId: vi.fn().mockResolvedValue([{ examId: 'e1', seq: 0, targetType: 'MATERIAL', targetId: 'q1' }]),
      },
      materialQuestions: {
        get: vi.fn().mockResolvedValue({
          questionId: 'q1',
          materialId: 'm1',
          subjectId: '4',
          number: 101,
          canonicalKey: '1-1',
          choice: 'CORRECT',
          correctAnswer: 'イ',
        }),
      },
      examCandidates: {
        getLatestCandidateByTargetId: vi.fn().mockResolvedValue(null),
      },
      materials: {
        get: vi.fn().mockResolvedValue({
          materialId: 'm1',
          title: '算数 4月マンスリー',
          grade: '6',
          provider: 'SAPIX',
          materialDate: '2026-04-01',
        }),
      },
    } as unknown as Repositories;

    const result = await createGetExam(repositories, 'e1');

    expect(result?.items[0]?.answerText).toBe('イ');
    expect(result?.items[0]?.correctAnswer).toBe('イ');
  });

  it('restores materialId from latest candidate when question row is missing', async () => {
    const { createGetExam } = await import('@/services/exam/getExam');

    const repositories = {
      exams: {
        get: vi.fn().mockResolvedValue({
          examId: 'e1',
          subject: '4',
          mode: 'MATERIAL',
          status: 'IN_PROGRESS',
          count: 1,
          createdDate: '2026-04-04',
          results: [],
        }),
      },
      examDetails: {
        listByExamId: vi.fn().mockResolvedValue([{ examId: 'e1', seq: 0, targetType: 'MATERIAL', targetId: 'q1' }]),
      },
      materialQuestions: {
        get: vi.fn().mockResolvedValue(null),
      },
      examCandidates: {
        getLatestCandidateByTargetId: vi.fn().mockResolvedValue({
          subject: '4',
          candidateKey: '2026-04-04#q1',
          id: 'c1',
          questionId: 'q1',
          mode: 'MATERIAL',
          materialId: 'm1',
          status: 'OPEN',
          correctCount: 0,
          nextTime: '2026-04-04',
          createdAt: '2026-04-04T00:00:00.000Z',
        }),
      },
      materials: {
        get: vi.fn().mockResolvedValue({
          materialId: 'm1',
          title: '算数 4月マンスリー',
          grade: '6',
          provider: 'SAPIX',
          materialDate: '2026-04-01',
        }),
      },
    } as unknown as Repositories;

    const result = await createGetExam(repositories, 'e1');

    expect(repositories.examCandidates.getLatestCandidateByTargetId).toHaveBeenCalledWith({
      subject: '4',
      targetId: 'q1',
    });
    expect(result?.items[0]?.materialId).toBe('m1');
    expect(result?.items[0]?.materialName).toBe('算数 4月マンスリー');
  });
});
