import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

describe('createExam (KANJI) with no candidates', () => {
  it('returns an empty exam instead of throwing 400', async () => {
    const { createCreateExam } = await import('@/services/exam/createExam');

    const repositories = {
      examCandidates: {
        listDueCandidates: vi.fn().mockResolvedValue([]),
        listCandidates: vi.fn().mockResolvedValue([]),
        lockCandidateIfUnlocked: vi.fn().mockResolvedValue(undefined),
      },
      wordMaster: {
        get: vi.fn(),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi.fn(),
      },
      exams: {
        put: vi.fn().mockResolvedValue(undefined),
      },
      s3: {
        putObject: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const getExam = vi.fn();
    const deleteExam = vi.fn();
    const createExam = createCreateExam({ repositories, getExam, deleteExam });

    const result = await createExam({ subject: '1', mode: 'KANJI', count: 60 });

    expect(result.mode).toBe('KANJI');
    expect(result.count).toBe(0);
    expect(result.questions).toEqual([]);
    expect(result.status).toBe('IN_PROGRESS');

    expect(repositories.examCandidates.listDueCandidates).toHaveBeenCalledTimes(1);
    expect(repositories.examCandidates.listCandidates).toHaveBeenCalledTimes(1);
    expect(repositories.exams.put).toHaveBeenCalledTimes(1);

    expect(getExam).not.toHaveBeenCalled();
    expect(repositories.s3.putObject).not.toHaveBeenCalled();
    expect(deleteExam).not.toHaveBeenCalled();
  });
});
