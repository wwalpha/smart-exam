import type { Kanji } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { WordMasterTable } from '@/types/db';

import type { KanjiService } from './index';

// 内部で利用する処理を定義する
const createKanjiImpl = async (
  repositories: Repositories,
  data: Parameters<KanjiService['registKanji']>[0],
): Promise<Kanji> => {
  // 内部で利用する処理を定義する
  const id = createUuid();

  const item: Kanji = { id, ...data };

  // 単語登録時は問題文全体を下線対象として扱い、読み/下線情報を必ず同時保存する。
  const underlineLength = data.kanji.length;

  const dbItem: WordMasterTable = {
    wordId: id,
    question: data.kanji,
    answer: data.reading,
    subject: data.subject,
    readingHiragana: data.reading,
    underlineSpec: {
      type: 'promptSpan',
      start: 0,
      length: underlineLength,
    },
  };

  // 非同期処理の完了を待つ
  await repositories.wordMaster.create(dbItem);

  // 非同期処理の完了を待つ
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

// 公開する処理を定義する
export const createCreateKanji = (repositories: Repositories): KanjiService['registKanji'] => {
  // 処理結果を呼び出し元へ返す
  return createKanjiImpl.bind(null, repositories);
};
