import { WordMasterTable } from '@/types/db';

import { update } from './update';

export const updateKanjiQuestionFields = async (
  wordId: string,
  updates: Pick<Partial<WordMasterTable>, 'readingHiragana' | 'underlineSpec'>,
): Promise<WordMasterTable | null> => {
  return update(wordId, updates);
};
