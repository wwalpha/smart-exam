import { describe, expect, it, vi } from 'vitest';

import { createKanjiService } from '@/services/kanji';
import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiService.importKanji (QUESTIONS format)', () => {
  it('creates kanji questions with reading/underline from "prompt|answer" lines', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        findByQuestionAnswer: vi.fn().mockResolvedValue(null),
        bulkCreate: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        bulkCreateCandidates: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'けいせい',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: '彼はけいせいを説明した。|形成\n',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);
    expect(res.questionIds?.length).toBe(1);

    expect(repositories.kanji.bulkCreate).toHaveBeenCalledTimes(1);
    expect(repositories.kanji.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        subject: '1',
        question: '彼はけいせいを説明した。',
        answer: '形成',
        readingHiragana: 'けいせい',
        underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
      }),
    ]);
  });

  it('returns line-numbered errors for invalid lines', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        findByQuestionAnswer: vi.fn().mockResolvedValue(null),
        bulkCreate: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        bulkCreateCandidates: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi.fn().mockResolvedValue({ items: [] }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: 'no-separator\na|b|c\n|abc\nabc|\n',
    });

    expect(res.successCount).toBe(0);
    expect(res.errorCount).toBe(4);
    expect(res.errors.map((e) => e.line)).toEqual([1, 2, 3, 4]);

    expect(res.errors.map((e) => e.reason)).toEqual([
      '形式が不正です（1行=「本文|答え漢字|YYYY-MM-DD,OK|...」）',
      '履歴の形式が不正です',
      '本文が空です',
      '答え漢字が空です',
    ]);
  });

  it('accepts katakana generated reading and stores hiragana reading', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        findByQuestionAnswer: vi.fn().mockResolvedValue(null),
        bulkCreate: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        bulkCreateCandidates: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'マッタク',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: 'マッタクわからない|全く\n',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    expect(repositories.kanji.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        question: 'マッタクわからない',
        answer: '全く',
        readingHiragana: 'まったく',
        underlineSpec: { type: 'promptSpan', start: 0, length: 4 },
      }),
    ]);
  });

  it('accepts hiragana generated reading when question text uses katakana', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        findByQuestionAnswer: vi.fn().mockResolvedValue(null),
        bulkCreate: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        bulkCreateCandidates: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'いしゃ',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: 'イシャにのどをみてもらう|医者\n',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    expect(repositories.kanji.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        question: 'イシャにのどをみてもらう',
        answer: '医者',
        readingHiragana: 'いしゃ',
        underlineSpec: { type: 'promptSpan', start: 0, length: 3 },
      }),
    ]);
  });

  it('counts duplicates within file and existing', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        findByQuestionAnswer: vi.fn().mockImplementation(async (params: { question: string; answer: string }) => {
          if (params.question === '彼はけいせいを説明した。' && params.answer === '形成') {
            return {
              question: '彼はけいせいを説明した。',
              answer: '形成',
              underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
            };
          }

          return null;
        }),
        bulkCreate: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        bulkCreateCandidates: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'めいかく',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: [
        '彼はけいせいを説明した。|形成', // existing duplicate
        '駅までの道をめいかくに示す|明確',
        '駅までの道をめいかくに示す|明確', // file duplicate
      ].join('\n'),
    });

    expect(res.successCount).toBe(1);
    expect(res.duplicateCount).toBe(2);
    expect(res.errorCount).toBe(0);
    expect(repositories.kanji.bulkCreate).toHaveBeenCalledTimes(1);
  });

  it('rebuilds only the latest three histories and skips candidate creation after exclusion', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        findByQuestionAnswer: vi.fn().mockResolvedValue(null),
        bulkCreate: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        deleteCandidatesByTargetId: vi.fn().mockResolvedValue(undefined),
        bulkCreateCandidates: vi.fn().mockResolvedValue(undefined),
      },
      examHistories: {
        putHistory: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'けいせい',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: '彼はけいせいを説明した。|形成|2026-01-01,NG|2026-02-01,OK|2026-03-01,OK|2026-04-01,OK\n',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    const createdCandidates = (
      repositories.examCandidates.bulkCreateCandidates as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0][0] as Array<{ status: string }>;
    const historyPutCalls = (
      repositories.examHistories.putHistory as unknown as {
        mock: { calls: Array<[{ status: string; nextTime: string }]> };
      }
    ).mock.calls;

    expect(historyPutCalls).toHaveLength(3);
    expect(historyPutCalls.map((call) => call[0].status)).toEqual(['CLOSED', 'CLOSED', 'EXCLUDED']);
    expect(historyPutCalls.at(-1)?.[0].nextTime).toBe('2099-12-31');
    expect(createdCandidates).toEqual([]);
  });
});
