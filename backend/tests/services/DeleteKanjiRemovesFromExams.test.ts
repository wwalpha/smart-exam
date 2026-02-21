import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiService.deleteKanji', () => {
  it('removes deleted wordId from existing KANJI exams (details/results/count) and clears pdfS3Key', async () => {
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
      examDetails: {
        listExamIdsByTargetId: vi.fn().mockResolvedValue(['e1']),
        listByExamId: vi.fn().mockImplementation(async (examId: string) => {
          if (examId === 'e1') {
            return [
              { examId: 'e1', seq: 1, targetType: 'KANJI', targetId: 'w1' },
              { examId: 'e1', seq: 2, targetType: 'KANJI', targetId: 'w2' },
              { examId: 'e1', seq: 3, targetType: 'KANJI', targetId: 'w3' },
            ];
          }
          return [];
        }),
        deleteByExamId: vi.fn().mockResolvedValue(undefined),
        putMany: vi.fn().mockResolvedValue(undefined),
      },
      exams: {
        get: vi.fn().mockImplementation(async (examId: string) => {
          if (examId !== 'e1') return null;
          return {
            examId: 'e1',
            subject: '1',
            mode: 'KANJI',
            status: 'IN_PROGRESS',
            count: 3,
            createdDate: '2026-02-14',
            pdfS3Key: 'exams/t1.pdf',
            results: [
              { id: 'w1', isCorrect: true },
              { id: 'w3', isCorrect: false },
            ],
          };
        }),
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
    expect(repositories.examDetails.listExamIdsByTargetId).toHaveBeenCalledWith('w1');
    expect(repositories.exams.get).toHaveBeenCalledWith('e1');

    // only t1 is affected
    expect(examsPut).toHaveBeenCalledTimes(1);
    const putArg = examsPut.mock.calls[0]?.[0] as any;

    expect(putArg.examId).toBe('e1');
    expect(putArg.mode).toBe('KANJI');
    expect(putArg.count).toBe(2);
    expect(putArg.results).toEqual([{ id: 'w3', isCorrect: false }]);

    expect(repositories.examDetails.deleteByExamId).toHaveBeenCalledWith('e1');
    expect(repositories.examDetails.putMany).toHaveBeenCalledWith('e1', ['w2', 'w3'], 'KANJI');

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
      examDetails: {
        listExamIdsByTargetId: vi.fn(),
      },
      exams: {
        get: vi.fn(),
        put: vi.fn(),
      },
    } as unknown as Repositories;

    const deleteKanji = createDeleteKanji(repositories);
    const ok = await deleteKanji('missing');

    expect(ok).toBe(false);
    expect(repositories.examCandidates.deleteCandidatesByTargetId).not.toHaveBeenCalled();
    expect(repositories.examDetails.listExamIdsByTargetId).not.toHaveBeenCalled();
  });
});
