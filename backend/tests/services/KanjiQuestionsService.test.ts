import { describe, expect, it, vi } from 'vitest';

import { createKanjiQuestionsService } from '@/services/kanjiQuestions/createKanjiQuestionsService';
import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiQuestionsService.generateReading (unit)', () => {
  it('persists GENERATED when Bedrock result is valid', async () => {
    const repositories = {
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId: 'q1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
        }),
        updateKanjiQuestionFields: vi.fn().mockResolvedValue({} as unknown),
      },
      bedrock: {
        generateKanjiQuestionReading: vi.fn().mockResolvedValue({
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        }),
      },
    } as unknown as Repositories;

    const service = createKanjiQuestionsService(repositories);

    const res = await service.generateReading('q1');

    expect(res).toEqual({
      id: 'q1',
      readingHiragana: 'けいせい',
      underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
      status: 'GENERATED',
    });

    expect(repositories.bedrock.generateKanjiQuestionReading).toHaveBeenCalledTimes(1);
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledTimes(1);
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledWith(
      'q1',
      expect.objectContaining({
        status: 'GENERATED',
        readingHiragana: 'けいせい',
        underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        ai: expect.objectContaining({
          promptVersion: 'kanji-reading-v1',
        }),
      }),
    );
  });

  it('retries up to 2 times when validation fails', async () => {
    const repositories = {
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId: 'q1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
        }),
        updateKanjiQuestionFields: vi.fn().mockResolvedValue({} as unknown),
      },
      bedrock: {
        generateKanjiQuestionReading: vi
          .fn()
          .mockResolvedValueOnce({
            readingHiragana: 'けいせい',
            underlineSpec: { type: 'promptSpan', start: 0, length: 4 },
          })
          .mockResolvedValueOnce({
            readingHiragana: 'けいせい',
            underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiQuestionsService(repositories);

    const res = await service.generateReading('q1');

    expect(res.status).toBe('GENERATED');
    expect(repositories.bedrock.generateKanjiQuestionReading).toHaveBeenCalledTimes(2);
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledTimes(1);
  });

  it('persists ERROR when all attempts fail', async () => {
    const repositories = {
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId: 'q1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
        }),
        updateKanjiQuestionFields: vi.fn().mockResolvedValue({} as unknown),
      },
      bedrock: {
        generateKanjiQuestionReading: vi.fn().mockResolvedValue({
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 0, length: 4 },
        }),
      },
    } as unknown as Repositories;

    const service = createKanjiQuestionsService(repositories);

    await expect(service.generateReading('q1')).rejects.toThrow();

    expect(repositories.bedrock.generateKanjiQuestionReading).toHaveBeenCalledTimes(3);
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledTimes(1);
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledWith(
      'q1',
      expect.objectContaining({
        status: 'ERROR',
        error: expect.objectContaining({
          code: 'GENERATE_READING_FAILED',
        }),
      }),
    );
  });
});

describe('KanjiQuestionsService.patch/verify (unit)', () => {
  it('patch validates slice match and saves fields', async () => {
    const repositories = {
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId: 'q1',
          subject: '1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
          status: 'DRAFT',
        }),
        updateKanjiQuestionFields: vi.fn().mockResolvedValue({
          wordId: 'q1',
          subject: '1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          status: 'GENERATED',
        } as unknown),
      },
    } as unknown as Repositories;

    const service = createKanjiQuestionsService(repositories);

    const res = await service.patch('q1', {
      readingHiragana: 'けいせい',
      underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
    });

    expect(res).toEqual(
      expect.objectContaining({
        id: 'q1',
        subject: '1',
        promptText: '彼はけいせいを説明した。',
        answerKanji: '形成',
        readingHiragana: 'けいせい',
        underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
        status: 'GENERATED',
      }),
    );
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledTimes(1);
  });

  it('patch rejects status VERIFIED (must use verify endpoint)', async () => {
    const repositories = {
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId: 'q1',
          subject: '1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          status: 'GENERATED',
        }),
      },
    } as unknown as Repositories;

    const service = createKanjiQuestionsService(repositories);
    await expect(
      service.patch('q1', {
        status: 'VERIFIED',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('verify sets status VERIFIED when fields exist and are valid', async () => {
    const repositories = {
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId: 'q1',
          subject: '1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          status: 'GENERATED',
        }),
        updateKanjiQuestionFields: vi.fn().mockResolvedValue({
          wordId: 'q1',
          subject: '1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          status: 'VERIFIED',
        } as unknown),
      },
      reviewTestCandidates: {
        getLatestOpenCandidateByTargetId: vi.fn().mockResolvedValue(null),
        createCandidate: vi.fn().mockResolvedValue({} as unknown),
      },
    } as unknown as Repositories;

    const service = createKanjiQuestionsService(repositories);
    const res = await service.verify('q1');

    expect(res.status).toBe('VERIFIED');
    expect(repositories.wordMaster.updateKanjiQuestionFields).toHaveBeenCalledWith(
      'q1',
      expect.objectContaining({ status: 'VERIFIED' }),
    );

    expect(repositories.reviewTestCandidates.getLatestOpenCandidateByTargetId).toHaveBeenCalledWith({
      subject: '1',
      targetId: 'q1',
    });
    expect(repositories.reviewTestCandidates.createCandidate).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '1',
        questionId: 'q1',
        mode: 'KANJI',
        status: 'OPEN',
        correctCount: 0,
      }),
    );
  });

  it('verify does not create OPEN candidate if one already exists', async () => {
    const repositories = {
      wordMaster: {
        get: vi.fn().mockResolvedValue({
          wordId: 'q1',
          subject: '1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          status: 'GENERATED',
        }),
        updateKanjiQuestionFields: vi.fn().mockResolvedValue({
          wordId: 'q1',
          subject: '1',
          promptText: '彼はけいせいを説明した。',
          answerKanji: '形成',
          readingHiragana: 'けいせい',
          underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          status: 'VERIFIED',
        } as unknown),
      },
      reviewTestCandidates: {
        getLatestOpenCandidateByTargetId: vi.fn().mockResolvedValue({ status: 'OPEN' } as unknown),
        createCandidate: vi.fn().mockResolvedValue({} as unknown),
      },
    } as unknown as Repositories;

    const service = createKanjiQuestionsService(repositories);
    const res = await service.verify('q1');

    expect(res.status).toBe('VERIFIED');
    expect(repositories.reviewTestCandidates.createCandidate).not.toHaveBeenCalled();
  });
});
