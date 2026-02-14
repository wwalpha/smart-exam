import { describe, expect, it, vi } from 'vitest';

import type { ReviewTestDetail } from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

describe('createReviewTest (KANJI) autofill printable fields', () => {
  it('tries to generate reading/underline when printable is empty', async () => {
    process.env.FILES_BUCKET_NAME = 'dummy-bucket';
    vi.resetModules();

    const { createCreateReviewTest } = await import('@/services/reviewTests/createReviewTest');

    const wordId = 'w-draft';
    const question = '彼はけいせいを説明した。';
    const answer = '形成';

    const repositories = {
      reviewTestCandidates: {
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
      reviewTests: {
        put: vi.fn().mockResolvedValue(undefined),
      },
      s3: {
        putObject: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const getReviewTest = vi.fn().mockResolvedValue({
      id: 't1',
      testId: 't1',
      subject: '1',
      mode: 'KANJI',
      createdDate: '2026-02-14',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/review-tests/t1/pdf', downloadUrl: '/api/review-tests/t1/pdf?download=1' },
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
          questionText: question,
          answerText: answer,
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        },
      ],
    } satisfies ReviewTestDetail);

    const deleteReviewTest = vi.fn().mockResolvedValue(true);
    const createReviewTest = createCreateReviewTest({ repositories, getReviewTest, deleteReviewTest });

    await expect(createReviewTest({ subject: '1', mode: 'KANJI', count: 60 })).resolves.toEqual(
      expect.objectContaining({ mode: 'KANJI' }),
    );

    expect(repositories.bedrock.generateKanjiQuestionReadingsBulk).toHaveBeenCalledTimes(1);
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledTimes(1);
    expect(repositories.s3.putObject).toHaveBeenCalledTimes(1);
  });
});
