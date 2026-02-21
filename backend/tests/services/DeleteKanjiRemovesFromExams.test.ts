import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiService.deleteKanji', () => {
  it('removes deleted wordId from existing KANJI review tests (questions/results/count) and clears pdfS3Key', async () => {
    const { createDeleteKanji } = await import('@/services/kanji/deleteKanji');

    const examsPut = vi.fn().mockResolvedValue(undefined);

    const repositories = {
      kanji: {
        get: vi.fn().mockResolvedValue({ wordId: 'w1', subject: '1' }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        deleteCandidatesByTargetId: vi.fn().mockResolvedValue(undefined),
      },
      exams: {
        scanAll: vi.fn().mockResolvedValue([
          {
            testId: 't1',
            subject: '1',
            mode: 'KANJI',
            status: 'IN_PROGRESS',
            count: 3,
            questions: ['w1', 'w2', 'w3'],
            createdDate: '2026-02-14',
            pdfS3Key: 'exams/t1.pdf',
            results: [
              { id: 'w1', isCorrect: true },
              { id: 'w3', isCorrect: false },
            ],
          },
          {
            testId: 't2',
            subject: '1',
            mode: 'KANJI',
            status: 'COMPLETED',
            count: 1,
            questions: ['w9'],
            createdDate: '2026-02-14',
            pdfS3Key: 'exams/t2.pdf',
            results: [{ id: 'w9', isCorrect: true }],
          },
          {
            testId: 't3',
            subject: '1',
            mode: 'QUESTION',
            status: 'IN_PROGRESS',
            count: 1,
            questions: ['q1'],
            createdDate: '2026-02-14',
            results: [],
          },
        ]),
        put: examsPut,
      },
    } as unknown as Repositories;

    const deleteKanji = createDeleteKanji(repositories);

    const ok = await deleteKanji('w1');
    expect(ok).toBe(true);

    expect(repositories.examCandidates.deleteCandidatesByTargetId).toHaveBeenCalledWith({
      subject: '1',
      targetId: 'w1',
    });
    expect(repositories.exams.scanAll).toHaveBeenCalledTimes(1);

    // only t1 is affected
    expect(examsPut).toHaveBeenCalledTimes(1);
    const putArg = examsPut.mock.calls[0]?.[0] as any;

    expect(putArg.testId).toBe('t1');
    expect(putArg.mode).toBe('KANJI');
    expect(putArg.questions).toEqual(['w2', 'w3']);
    expect(putArg.count).toBe(2);
    expect(putArg.results).toEqual([{ id: 'w3', isCorrect: false }]);

    // pdfS3Key should be removed to force regeneration
    expect('pdfS3Key' in putArg).toBe(false);

    expect(repositories.kanji.delete).toHaveBeenCalledWith('w1');
  });

  it('returns false when target does not exist', async () => {
    const { createDeleteKanji } = await import('@/services/kanji/deleteKanji');

    const repositories = {
      kanji: {
        get: vi.fn().mockResolvedValue(null),
      },
      examCandidates: {
        deleteCandidatesByTargetId: vi.fn(),
      },
      exams: {
        scanAll: vi.fn(),
        put: vi.fn(),
      },
    } as unknown as Repositories;

    const deleteKanji = createDeleteKanji(repositories);
    const ok = await deleteKanji('missing');

    expect(ok).toBe(false);
    expect(repositories.examCandidates.deleteCandidatesByTargetId).not.toHaveBeenCalled();
    expect(repositories.exams.scanAll).not.toHaveBeenCalled();
  });
});
