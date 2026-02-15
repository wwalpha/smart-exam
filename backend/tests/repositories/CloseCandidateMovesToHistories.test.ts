import { describe, expect, it, vi, beforeEach } from 'vitest';

const { getMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('@/lib/aws', () => ({
  dbHelper: {
    get: getMock,
    put: putMock,
    delete: deleteMock,
  },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    TABLE_EXAM_CANDIDATES: 'exam_candidates',
    TABLE_EXAM_HISTORIES: 'exam_histories',
  },
}));

import { closeCandidateIfMatch } from '@/repositories/examCandidates/closeCandidateIfMatch';

describe('closeCandidateIfMatch', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
  });

  it('moves candidate to exam_histories and deletes from exam_candidates', async () => {
    getMock.mockResolvedValue({
      Item: {
        subject: '1',
        candidateKey: '2026-02-15#abc',
        id: 'abc',
        questionId: 'q1',
        mode: 'KANJI',
        status: 'LOCKED',
        correctCount: 2,
        nextTime: '2026-02-15',
        examId: 'exam-1',
        createdAt: '2026-02-14T00:00:00.000Z',
      },
    });

    await closeCandidateIfMatch({
      subject: '1',
      candidateKey: '2026-02-15#abc',
      expectedExamId: 'exam-1',
    });

    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        TableName: 'exam_histories',
        Item: expect.objectContaining({
          subject: '1',
          candidateKey: '2026-02-15#abc',
          id: 'abc',
          questionId: 'q1',
          mode: 'KANJI',
          status: 'CLOSED',
          correctCount: 2,
          nextTime: '2026-02-15',
          createdAt: '2026-02-14T00:00:00.000Z',
        }),
      }),
    );
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        TableName: 'exam_candidates',
        Key: { subject: '1', candidateKey: '2026-02-15#abc' },
      }),
    );
  });

  it('is idempotent when candidate is already removed', async () => {
    getMock.mockResolvedValue({ Item: undefined });

    await expect(
      closeCandidateIfMatch({
        subject: '1',
        candidateKey: '2026-02-15#abc',
        expectedExamId: 'exam-1',
      }),
    ).resolves.toBeUndefined();

    expect(putMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
