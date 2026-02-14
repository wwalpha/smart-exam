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
        scanAll: vi.fn().mockRejectedValue(new Error('scan failed')),
        put: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const deleteManyKanji = createDeleteManyKanji(repositories);

    await expect(deleteManyKanji(['w1', 'w2'])).resolves.toBeUndefined();
    expect(repositories.wordMaster.delete).toHaveBeenCalledTimes(2);
    expect(repositories.exams.scanAll).toHaveBeenCalledTimes(1);
  });
});
