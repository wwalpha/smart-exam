import { WordsService } from '@/services/WordsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const deleteKanji = async (id: string): Promise<boolean> => {
  const existing = await WordsService.get(id);
  if (!existing) return false;

  await ReviewTestCandidatesService.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
  await WordsService.delete(id);
  return true;
};
