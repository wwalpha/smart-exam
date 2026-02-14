import { describe, expect, it, vi } from 'vitest';
import { createKanjiService } from '@/services/kanji/createKanjiService';
import { ImportKanjiBodySchema } from '@/controllers/kanji/createKanjiController';
import type { Repositories } from '@/repositories/createRepositories';

describe('KanjiRepository.importKanji (pipe format)', () => {
  it('creates master and persists imported histories', async () => {
    const repositories = {
      wordMaster: {
        listKanji: vi.fn().mockResolvedValue([] as unknown),
        create: vi.fn().mockResolvedValue(undefined),
      },
      reviewTestCandidates: {
        deleteCandidatesByTargetId: vi.fn().mockResolvedValue(undefined),
        createCandidate: vi.fn().mockResolvedValue({} as unknown),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);

    const res = await service.importKanji({
      subject: '1',
      fileContent: '漢字|かんじ|2016/01/01,OK|2015/11/01,NG|2015/10/01,OK',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    expect(repositories.wordMaster.create).toHaveBeenCalledTimes(1);

    // 履歴3件（CLOSED） + 現在状態1件（OPEN/EXCLUDED）
    expect(repositories.reviewTestCandidates.createCandidate).toHaveBeenCalledTimes(4);
    expect(repositories.reviewTestCandidates.deleteCandidatesByTargetId).toHaveBeenCalledTimes(1);
  });

  it('fails when subject is missing', async () => {
    const parsed = ImportKanjiBodySchema.safeParse({
      fileContent: '漢字|かんじ',
      importType: 'MASTER',
    });
    expect(parsed.success).toBe(false);
  });
});
