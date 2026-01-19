import { WordMasterService } from '@/services/WordMasterService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const deleteKanji = async (id: string): Promise<boolean> => {
  const existing = await WordMasterService.get(id);
  if (!existing) return false;

  await ReviewTestCandidatesService.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
  await WordMasterService.delete(id);
  return true;
};
