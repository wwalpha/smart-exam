import { WordsService } from '@/services/WordsService';

export const deleteManyKanji = async (ids: string[]): Promise<void> => {
  const uniqueIds = Array.from(new Set(ids.map((x) => x.trim()).filter((x) => x.length > 0)));
  for (const id of uniqueIds) {
    const existing = await WordsService.get(id);
    if (!existing) continue;
    await WordsService.delete(id);
  }
};
