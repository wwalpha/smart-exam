import { describe, expect, it, vi } from 'vitest';

import { createKanjiService } from '@/services/kanji/createKanjiService';
import { ImportKanjiBodySchema } from '@/controllers/kanji';
import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiService.importKanji (single pipe format)', () => {
  it('creates kanji questions and persists imported histories', async () => {
    const repositories = {
      wordMaster: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        bulkCreate: vi.fn().mockResolvedValue(undefined),
      },
      examCandidates: {
        deleteCandidatesByTargetId: vi.fn().mockResolvedValue(undefined),
        bulkCreateCandidates: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'しゅっぱん',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: '詩集をしゅっぱんする。|出版|2016/01/01,OK|2015/11/01,NG|2015/10/01,OK',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    expect(repositories.wordMaster.bulkCreate).toHaveBeenCalledTimes(1);

    // 履歴3件（CLOSED） + 最終状態1件（OPEN/EXCLUDED）
    const createdCandidates = (
      repositories.examCandidates.bulkCreateCandidates as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0][0] as unknown[];
    expect(createdCandidates.length).toBe(4);
    expect(repositories.examCandidates.deleteCandidatesByTargetId).toHaveBeenCalledTimes(1);
  });

  it('fails when subject is missing', async () => {
    const parsed = ImportKanjiBodySchema.safeParse({
      fileContent: '漢字|かんじ',
    });
    expect(parsed.success).toBe(false);
  });
});
