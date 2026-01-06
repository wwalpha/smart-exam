import { WordsService } from '@/services/WordsService';

export const deleteKanji = async (id: string): Promise<boolean> => {
  const existing = await WordsService.get(id);
  if (!existing) return false;
  await WordsService.delete(id);
  return true;
};
