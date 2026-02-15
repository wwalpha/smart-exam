import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiService.deleteManyKanji', () => {
  it('does not throw when exam sync fails after deleting words', async () => {
    const { createDeleteManyKanji } = await import('@/services/kanji/deleteManyKanji');

    const repositories = {
      wordMaster: {
        get: vi
          .fn()
          .mockResolvedValueOnce({ wordId: 'w1', subject: '1' })
          .mockResolvedValueOnce({ wordId: 'w2', subject: '1' }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        deleteCandidatesByTargetId: vi.fn().mockResolvedValue(undefined),
      },
      exams: {
        get: vi.fn().mockRejectedValue(new Error('exam get failed')),
        put: vi.fn().mockResolvedValue(undefined),
      },
      examDetails: {
        listExamIdsByTargetId: vi.fn().mockResolvedValue(['e1']),
        listByExamId: vi.fn().mockResolvedValue([]),
        deleteByExamId: vi.fn().mockResolvedValue(undefined),
        putMany: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const deleteManyKanji = createDeleteManyKanji(repositories);

    await expect(deleteManyKanji(['w1', 'w2'])).resolves.toBeUndefined();
    expect(repositories.wordMaster.delete).toHaveBeenCalledTimes(2);
    expect(repositories.examDetails.listExamIdsByTargetId).toHaveBeenCalledTimes(2);
    expect(repositories.exams.get).toHaveBeenCalledTimes(1);
  });
});
