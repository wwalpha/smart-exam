import type { Kanji } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { WordMasterTable } from '@/types/db';

import { computeKanjiQuestionFields } from './computeKanjiQuestionFields';
import type { KanjiService } from './index';

const resolveKanjiQuestionFields = async (params: {
  repositories: Repositories;
  wordId: string;
  question: string;
  answer: string;
}): Promise<{ readingHiragana: string; underlineSpec: { type: 'promptSpan'; start: number; length: number } }> => {
  const bulk = await params.repositories.bedrock.generateKanjiQuestionReadingsBulk({
    items: [{ id: params.wordId, question: params.question, answer: params.answer }],
  });
  console.log('Bedrock からの生成結果:', bulk);

  const generated = bulk.items.find((item) => item.id === params.wordId)?.readingHiragana?.trim() ?? '';
  if (!generated) {
    throw new Error('readingHiragana の生成に失敗しました');
  }

  return computeKanjiQuestionFields({
    question: params.question,
    readingHiragana: generated,
  });
};

// 公開するサービス処理を定義する
export const registKanji = async (
  repositories: Repositories,
  data: Parameters<KanjiService['registKanji']>[0],
): Promise<Kanji> => {
  const id = createUuid();

  const item: Kanji = { id, ...data };

  // import と同じ生成経路に揃えるため、読み/下線は Bedrock + 共通計算で生成する。
  const kanjiQuestionFields = await resolveKanjiQuestionFields({
    repositories,
    wordId: id,
    question: data.kanji,
    answer: data.reading,
  });

  const dbItem: WordMasterTable = {
    wordId: id,
    question: data.kanji,
    answer: data.reading,
    subject: data.subject,
    readingHiragana: kanjiQuestionFields.readingHiragana,
    underlineSpec: kanjiQuestionFields.underlineSpec,
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
