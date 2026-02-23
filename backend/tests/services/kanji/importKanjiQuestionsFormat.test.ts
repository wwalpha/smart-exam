import { describe, expect, it, vi } from 'vitest';

import { createKanjiService } from '@/services/kanji';
import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiService.importKanji (QUESTIONS format)', () => {
  it('creates kanji questions with reading/underline from "prompt|answer" lines', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
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
        listKanji: vi.fn().mockResolvedValue([
          {
            question: '彼はけいせいを説明した。',
            answer: '形成',
            // 既存データ扱いにするため（worksheet判定）
            underlineSpec: { type: 'promptSpan', start: 2, length: 4 },
          },
        ] as unknown),
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

  it('rebuilds candidates from histories and creates a final candidate (OPEN/EXCLUDED)', async () => {
    const repositories = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
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
      fileContent: '彼はけいせいを説明した。|形成|2026-02-01,OK|2026-02-05,NG\n',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    const created = (repositories.kanji.bulkCreate as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as Array<{ wordId: string }>;
    const id = created[0].wordId;

    expect(repositories.examCandidates.deleteCandidatesByTargetId).toHaveBeenCalledWith({
      subject: '1',
      targetId: id,
    });

    const createdCandidates = (
      repositories.examCandidates.bulkCreateCandidates as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0][0] as Array<{ status: string }>;
    const historyPutCalls = (
      repositories.examHistories.putHistory as unknown as { mock: { calls: Array<[{ status: string }]> } }
    ).mock.calls;

    expect(historyPutCalls.length).toBeGreaterThan(0);
    expect(historyPutCalls.every((call) => call[0].status === 'CLOSED')).toBe(true);
    expect(createdCandidates.some((c) => c.status === 'OPEN' || c.status === 'EXCLUDED')).toBe(true);
    expect(createdCandidates.every((c) => c.status !== 'CLOSED')).toBe(true);
  });
});
