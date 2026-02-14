import type { Kanji } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { WordMasterTable } from '@/types/db';

import type { KanjiService } from './createKanjiService';

// 公開するサービス処理を定義する
export const createCreateKanji = (repositories: Repositories): KanjiService['createKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (data): Promise<Kanji> => {
    // 処理で使う値を準備する
    const id = createUuid();

    const item: Kanji = { id, ...data };

    const dbItem: WordMasterTable = {
      wordId: id,
      question: data.kanji,
      answer: data.reading || '',
      subject: data.subject,
    };

    // 非同期処理の完了を待つ
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

    // 処理結果を呼び出し元へ返す
    return item;
  };
};
