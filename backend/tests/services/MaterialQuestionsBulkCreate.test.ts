import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

describe('MaterialQuestionsService.createQuestionsBulk', () => {
  it('creates questions with one bulk write and one count update', async () => {
    const repositories = {
      materials: {
        get: vi.fn().mockResolvedValue({
          materialId: 'm1',
          subjectId: '4',
          isCompleted: false,
        }),
        incrementQuestionCount: vi.fn().mockResolvedValue(undefined),
      },
      materialQuestions: {
        bulkCreate: vi.fn().mockResolvedValue(undefined),
        listByMaterialId: vi.fn().mockResolvedValue([
          {
            questionId: 'q1',
            materialId: 'm1',
            subjectId: '4',
            number: 1,
            canonicalKey: '1-1',
            choice: 'CORRECT',
          },
          {
            questionId: 'q2',
            materialId: 'm1',
            subjectId: '4',
            number: 1,
            canonicalKey: '1-2',
            choice: 'CORRECT',
          },
        ]),
      },
    } as unknown as Repositories;

    const { createMaterialQuestionsService } = await import('@/services/materialQuestions');
    const service = createMaterialQuestionsService(repositories);

    const result = await service.createQuestionsBulk({
      materialId: 'm1',
      items: [
        { canonicalKey: '1-1', subject: '4' },
        { canonicalKey: '1-2', subject: '4' },
      ],
    });

    expect(repositories.materialQuestions.bulkCreate).toHaveBeenCalledTimes(1);
    expect(repositories.materials.incrementQuestionCount).toHaveBeenCalledWith('m1', 2);
    expect(result.map((item) => item.canonicalKey)).toEqual(['1-1', '1-2']);
  });
});
