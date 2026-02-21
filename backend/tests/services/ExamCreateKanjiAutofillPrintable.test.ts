import { describe, expect, it, vi } from 'vitest';

import type { ExamDetail } from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

describe('createExam (KANJI) printable filter only', () => {
  it('does not auto-generate fields and creates exam with zero printable items', async () => {
    process.env.FILES_BUCKET_NAME = 'dummy-bucket';
    vi.resetModules();

    const { createCreateExam } = await import('@/services/exam');

    const wordId = 'w-draft';
    const question = '彼はけいせいを説明した。';
    const answer = '形成';

    const repositories = {
      examCandidates: {
        listDueCandidates: vi.fn().mockResolvedValue([
          {
            subject: '1',
            candidateKey: '2026-02-14#c1',
            id: 'c1',
            questionId: wordId,
            mode: 'KANJI',
            status: 'OPEN',
            correctCount: 0,
            nextTime: '2026-02-14',
            createdAt: '2026-02-14T00:00:00.000Z',
          },
        ]),
        lockCandidateIfUnlocked: vi.fn().mockResolvedValue(undefined),
      },
      kanji: {
        get: vi.fn().mockResolvedValue({
          wordId,
          subject: '1',
          question,
          answer,
        }),
      },
      exams: {
        put: vi.fn().mockResolvedValue(undefined),
      },
      examDetails: {
        putMany: vi.fn().mockResolvedValue(undefined),
      },
      s3: {
        putObject: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const getExam = vi.fn().mockResolvedValue({
      examId: 't1',
      subject: '1',
      mode: 'KANJI',
      createdDate: '2026-02-14',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/exam/t1/pdf', downloadUrl: '/api/exam/t1/pdf?download=1' },
      count: 1,
      results: [],
      items: [
        {
          id: 'item-1',
          itemId: 'item-1',
          examId: 't1',
          targetType: 'KANJI',
          targetId: wordId,
          questionText: question,
          answerText: answer,
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        },
      ],
    } satisfies ExamDetail);

    const deleteExam = vi.fn().mockResolvedValue(true);
    const createExam = createCreateExam({ repositories, getExam, deleteExam });

    const result = await createExam({ subject: '1', mode: 'KANJI', count: 60 });

    expect(result.mode).toBe('KANJI');
    expect(result.count).toBe(0);

    expect(repositories.examCandidates.lockCandidateIfUnlocked).not.toHaveBeenCalled();
    expect(repositories.s3.putObject).not.toHaveBeenCalled();
  });
});
