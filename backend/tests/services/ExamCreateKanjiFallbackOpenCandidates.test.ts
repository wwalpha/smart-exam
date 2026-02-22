import { describe, expect, it, vi } from 'vitest';

import type { ExamDetail } from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

describe('createExam (KANJI) fallback open candidates', () => {
  it('does not create questions from OPEN candidates when nextTime is in the future', async () => {
    process.env.FILES_BUCKET_NAME = 'dummy-bucket';
    vi.resetModules();

    const { createCreateExam } = await import('@/services/exam');

    const wordId = 'w-fallback';
    const repositories = {
      examCandidates: {
        listDueCandidates: vi.fn().mockResolvedValue([]),
        listCandidates: vi.fn().mockResolvedValue([
          {
            subject: '1',
            candidateKey: '2026-03-30#c1',
            id: 'c1',
            questionId: wordId,
            mode: 'KANJI',
            status: 'OPEN',
            correctCount: 1,
            nextTime: '2026-03-30',
            createdAt: '2026-02-14T00:00:00.000Z',
          },
        ]),
        lockCandidateIfUnlocked: vi.fn().mockResolvedValue(undefined),
      },
      kanji: {
        get: vi.fn().mockResolvedValue({
          wordId,
          subject: '1',
          question: '彼はけいせいを説明した。',
          answer: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        }),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi.fn(),
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
          questionText: '彼はけいせいを説明した。',
          answerText: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        },
      ],
    } satisfies ExamDetail);

    const deleteExam = vi.fn().mockResolvedValue(true);
    const createExam = createCreateExam({ repositories, getExam, deleteExam });

    await expect(createExam({ subject: '1', mode: 'KANJI', count: 10 })).resolves.toEqual(
      expect.objectContaining({ mode: 'KANJI', count: 0 }),
    );

    expect(repositories.examCandidates.listDueCandidates).toHaveBeenCalledTimes(1);
    expect(repositories.examCandidates.listCandidates).toHaveBeenCalledTimes(1);
    expect(repositories.examCandidates.lockCandidateIfUnlocked).not.toHaveBeenCalled();
    expect(repositories.exams.put).toHaveBeenCalledTimes(1);
    expect(repositories.s3.putObject).not.toHaveBeenCalled();
  });
});
