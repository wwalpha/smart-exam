import { KanjiTable } from '@/types/db';

import { update } from './update';

export const updateKanjiQuestionFields = async (
  wordId: string,
  updates: Pick<Partial<KanjiTable>, 'readingHiragana' | 'underlineSpec'>,
): Promise<KanjiTable | null> => {
  return update(wordId, updates);
};
