import { describe, expect, it, vi } from 'vitest';

import type { ExamDetail } from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

describe('createExam (KANJI) fallback open candidates', () => {
  it('creates exam from OPEN candidates when due candidates are empty', async () => {
    process.env.FILES_BUCKET_NAME = 'dummy-bucket';
    vi.resetModules();

    const { createCreateExam } = await import('@/services/exam/createExam');

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
      wordMaster: {
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
      s3: {
        putObject: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const getExam = vi.fn().mockResolvedValue({
      id: 't1',
      testId: 't1',
      subject: '1',
      mode: 'KANJI',
      createdDate: '2026-02-14',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/exam/kanji/t1/pdf', downloadUrl: '/api/exam/kanji/t1/pdf?download=1' },
      count: 1,
      questions: [wordId],
      results: [],
      items: [
        {
          id: 'item-1',
          itemId: 'item-1',
          testId: 't1',
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
      expect.objectContaining({ mode: 'KANJI', count: 1 }),
    );

    expect(repositories.examCandidates.listDueCandidates).toHaveBeenCalledTimes(1);
    expect(repositories.examCandidates.listCandidates).toHaveBeenCalledTimes(1);
    expect(repositories.examCandidates.lockCandidateIfUnlocked).toHaveBeenCalledTimes(1);
    expect(repositories.exams.put).toHaveBeenCalledTimes(1);
    expect(repositories.s3.putObject).toHaveBeenCalledTimes(1);
  });
});
