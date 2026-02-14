import type { Kanji } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { WordMasterTable } from '@/types/db';

import type { KanjiService } from './createKanjiService';

export const createCreateKanji = (repositories: Repositories): KanjiService['createKanji'] => {
  return async (data): Promise<Kanji> => {
    const id = createUuid();

    const item: Kanji = { id, ...data };

    const dbItem: WordMasterTable = {
      wordId: id,
      question: data.kanji,
      answer: data.reading || '',
      subject: data.subject,
    };

    await repositories.wordMaster.create(dbItem);

    // 候補を作成（新規作成時はOPEN）
    await repositories.examCandidates.createCandidate({
      subject: data.subject,
      questionId: id,
      mode: 'KANJI',
      nextTime: DateUtils.todayYmd(),
      correctCount: 0,
      status: 'OPEN',
      createdAtIso: DateUtils.now(),
    });

    return item;
  };
};
