import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { computeKanjiQuestionFields } from './computeKanjiQuestionFields';
import type { KanjiService } from './createKanjiService';

// 公開するサービス処理を定義する
export const createUpdateKanji = (repositories: Repositories): KanjiService['updateKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (id, data): Promise<Kanji | null> => {
    // 非同期で必要な値を取得する
    const existing = await repositories.wordMaster.get(id);
    // 条件に応じて処理を分岐する
    if (!existing) return null;

    // 処理で使う値を準備する
    const nextQuestion = data.kanji !== undefined ? data.kanji : String(existing.question ?? '');
    // 処理で使う値を準備する
    const nextAnswer = data.reading !== undefined ? data.reading : String(existing.answer ?? '');

    // 処理で使う値を準備する
    const shouldRegenerateKanjiQuestionFields =
      (data.kanji !== undefined || data.reading !== undefined) &&
      Boolean(existing.readingHiragana || existing.underlineSpec);

    // 処理で使う値を準備する
    const kanjiQuestionFields = shouldRegenerateKanjiQuestionFields
      ? (() => {
          // 処理で使う値を準備する
          const question = String(nextQuestion ?? '').trim();
          // 処理で使う値を準備する
          const answer = String(nextAnswer ?? '').trim();
          // 条件に応じて処理を分岐する
          if (!question || !answer) {
            throw new Error('question/answer is missing');
          }
          // 処理結果を呼び出し元へ返す
          return { question, answer };
        })()
      : null;

    // 処理で使う値を準備する
    const regenerated = shouldRegenerateKanjiQuestionFields
      ? await (async () => {
          // 非同期で必要な値を取得する
          const bulk = await repositories.bedrock.generateKanjiQuestionReadingsBulk({
            items: [{ id, question: kanjiQuestionFields!.question, answer: kanjiQuestionFields!.answer }],
          });
          // 処理で使う値を準備する
          const raw = bulk.items.find((x) => x.id === id);
          // 条件に応じて処理を分岐する
          if (!raw) throw new Error('読み生成に失敗しました: 結果が返りませんでした');

          // 処理結果を呼び出し元へ返す
          return computeKanjiQuestionFields({
            question: kanjiQuestionFields!.question,
            readingHiragana: String(raw.readingHiragana ?? '').trim(),
          });
        })()
      : null;

    // 非同期で必要な値を取得する
    const updated = await repositories.wordMaster.update(id, {
      ...(data.kanji !== undefined ? { question: data.kanji } : {}),
      ...(data.reading !== undefined ? { answer: data.reading } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(regenerated
        ? { readingHiragana: regenerated.readingHiragana, underlineSpec: regenerated.underlineSpec }
        : {}),
    });
    // 条件に応じて処理を分岐する
    if (!updated) return null;

    // 処理結果を呼び出し元へ返す
    return {
      id: updated.wordId,
      kanji: updated.question,
      reading: updated.answer,
      subject: updated.subject,
    };
  };
};
