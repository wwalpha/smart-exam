import { describe, expect, it, vi } from 'vitest';
import { KanjiRepository, WordTestAttemptRepository } from '@/repositories';
import { WordsService } from '@/services/WordsService';

vi.mock('@/services/WordsService');

// WordTestAttemptRepository is spied per-test

describe('KanjiRepository.importKanji (pipe format)', () => {
  it('creates master and 3 history attempts for 3 dated tokens', async () => {
    vi.mocked(WordsService.listKanji).mockResolvedValue([] as any);
    vi.mocked(WordsService.create).mockResolvedValue();
    vi.spyOn(WordTestAttemptRepository, 'createSubmittedAttempt').mockResolvedValue({ wordTestAttemptId: 'a1' });

    const res = await KanjiRepository.importKanji({
      subject: '1',
      mode: 'SKIP',
      fileContent: '漢字|かんじ|2016/01/01,OK|2015/11/01,NG|2015/10/01,OK',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    expect(WordsService.create).toHaveBeenCalledTimes(1);
    expect(WordTestAttemptRepository.createSubmittedAttempt).toHaveBeenCalledTimes(3);
  });

  it('fails when subject is missing', async () => {
    const res = await KanjiRepository.importKanji({
      mode: 'SKIP',
      fileContent: '漢字|かんじ',
    });

    expect(res.successCount).toBe(0);
    expect(res.errorCount).toBeGreaterThan(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
