import { describe, expect, it, vi } from 'vitest';
import { KanjiRepository } from '@/repositories';
import { WordMasterService } from '@/services/WordMasterService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

vi.mock('@/services/WordMasterService');
vi.mock('@/services/ReviewTestCandidatesService');

describe('KanjiRepository.importKanji (pipe format)', () => {
  it('creates master and persists imported histories', async () => {
    vi.mocked(WordMasterService.listKanji).mockResolvedValue([] as any);
    vi.mocked(WordMasterService.create).mockResolvedValue();
    vi.mocked(ReviewTestCandidatesService.deleteCandidatesByTargetId).mockResolvedValue();
    vi.mocked(ReviewTestCandidatesService.createCandidate).mockResolvedValue({} as any);

    const res = await KanjiRepository.importKanji({
      subject: '1',
      fileContent: '漢字|かんじ|2016/01/01,OK|2015/11/01,NG|2015/10/01,OK',
    });

    expect(res.successCount).toBe(1);
    expect(res.errorCount).toBe(0);

    expect(WordMasterService.create).toHaveBeenCalledTimes(1);

    // 履歴3件（CLOSED） + 現在状態1件（OPEN/EXCLUDED）
    expect(ReviewTestCandidatesService.createCandidate).toHaveBeenCalledTimes(4);
    expect(ReviewTestCandidatesService.deleteCandidatesByTargetId).toHaveBeenCalledTimes(1);
  });

  it('fails when subject is missing', async () => {
    const res = await KanjiRepository.importKanji({
      fileContent: '漢字|かんじ',
    });

    expect(res.successCount).toBe(0);
    expect(res.errorCount).toBeGreaterThan(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
