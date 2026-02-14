import { describe, expect, it, vi } from 'vitest';

import { createKanjiService } from '@/services/kanji/createKanjiService';
import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiService.importKanji (QUESTIONS format)', () => {
  it('creates DRAFT kanji questions from "prompt|answer" lines', async () => {
    const repositories = {
      wordMaster: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        create: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      importType: 'QUESTIONS',
      fileContent: '彼はけいせいを説明した。|形成\n',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);
    expect(res.questionIds?.length).toBe(1);

    expect(repositories.wordMaster.create).toHaveBeenCalledTimes(1);
    expect(repositories.wordMaster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '1',
        promptText: '彼はけいせいを説明した。',
        answerKanji: '形成',
        status: 'DRAFT',
        // backward-compat required fields
        question: '形成',
        answer: '',
      }),
    );
  });

  it('returns line-numbered errors for invalid lines', async () => {
    const repositories = {
      wordMaster: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      importType: 'QUESTIONS',
      fileContent: 'no-separator\na|b|c\n|abc\nabc|\n',
    });

    expect(res.successCount).toBe(0);
    expect(res.errorCount).toBe(4);
    expect(res.errors.map((e) => e.line)).toEqual([1, 2, 3, 4]);
  });

  it('counts duplicates within file and existing', async () => {
    const repositories = {
      wordMaster: {
        listKanji: vi.fn().mockResolvedValue([
          {
            promptText: '彼はけいせいを説明した。',
            answerKanji: '形成',
          },
        ] as unknown),
        create: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      importType: 'QUESTIONS',
      fileContent: [
        '彼はけいせいを説明した。|形成', // existing duplicate
        '駅までの道をめいかくに示す|明確',
        '駅までの道をめいかくに示す|明確', // file duplicate
      ].join('\n'),
    });

    expect(res.successCount).toBe(1);
    expect(res.duplicateCount).toBe(2);
    expect(res.errorCount).toBe(0);
    expect(repositories.wordMaster.create).toHaveBeenCalledTimes(1);
  });
});
