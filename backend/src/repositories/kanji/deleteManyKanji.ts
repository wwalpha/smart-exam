import { WordsService } from '@/services/WordsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const deleteManyKanji = async (ids: string[]): Promise<void> => {
  const uniqueIds = Array.from(new Set(ids.map((x) => x.trim()).filter((x) => x.length > 0)));
  for (const id of uniqueIds) {
    const existing = await WordsService.get(id);
    if (!existing) continue;

    await ReviewTestCandidatesService.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
    await WordsService.delete(id);
  }
};
