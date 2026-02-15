import { describe, expect, it, vi } from 'vitest';

import type { ExamDetail } from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

describe('createExam (KANJI) autofill printable fields', () => {
  it('tries to generate reading/underline when printable is empty', async () => {
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
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId,
          subject: '1',
          question,
          answer,
        }),
        updateKanjiQuestionFields: vi.fn().mockResolvedValue({
          wordId,
          subject: '1',
          question,
          answer,
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        }),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi.fn().mockResolvedValue({
          items: [{ id: wordId, readingHiragana: 'けいせい' }],
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
      pdf: { url: '/api/exam/kanji/t1/pdf', downloadUrl: '/api/exam/kanji/t1/pdf?download=1' },
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

    await expect(createExam({ subject: '1', mode: 'KANJI', count: 60 })).resolves.toEqual(
      expect.objectContaining({ mode: 'KANJI' }),
    );

    expect(repositories.bedrock.generateKanjiQuestionReadingsBulk).toHaveBeenCalledTimes(1);
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledTimes(1);
    expect(repositories.s3.putObject).toHaveBeenCalledTimes(1);
  });
});
