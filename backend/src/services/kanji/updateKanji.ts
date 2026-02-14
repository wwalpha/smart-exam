import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { computeKanjiQuestionFields } from './computeKanjiQuestionFields';
import type { KanjiService } from './createKanjiService';

export const createUpdateKanji = (repositories: Repositories): KanjiService['updateKanji'] => {
  return async (id, data): Promise<Kanji | null> => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) return null;

    const nextQuestion = data.kanji !== undefined ? data.kanji : String(existing.question ?? '');
    const nextAnswer = data.reading !== undefined ? data.reading : String(existing.answer ?? '');

    const shouldRegenerateKanjiQuestionFields =
      (data.kanji !== undefined || data.reading !== undefined) &&
      Boolean(existing.readingHiragana || existing.underlineSpec);

    const kanjiQuestionFields = shouldRegenerateKanjiQuestionFields
      ? (() => {
          const question = String(nextQuestion ?? '').trim();
          const answer = String(nextAnswer ?? '').trim();
          if (!question || !answer) {
            throw new Error('question/answer is missing');
          }
          return { question, answer };
        })()
      : null;

    const regenerated = shouldRegenerateKanjiQuestionFields
      ? await (async () => {
          const bulk = await repositories.bedrock.generateKanjiQuestionReadingsBulk({
            items: [{ id, question: kanjiQuestionFields!.question, answer: kanjiQuestionFields!.answer }],
          });
          const raw = bulk.items.find((x) => x.id === id);
          if (!raw) throw new Error('読み生成に失敗しました: 結果が返りませんでした');

          return computeKanjiQuestionFields({
            question: kanjiQuestionFields!.question,
            readingHiragana: String(raw.readingHiragana ?? '').trim(),
          });
        })()
      : null;

    const updated = await repositories.wordMaster.update(id, {
      ...(data.kanji !== undefined ? { question: data.kanji } : {}),
      ...(data.reading !== undefined ? { answer: data.reading } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(regenerated
        ? { readingHiragana: regenerated.readingHiragana, underlineSpec: regenerated.underlineSpec }
        : {}),
    });
    if (!updated) return null;

    return {
      id: updated.wordId,
      kanji: updated.question,
      reading: updated.answer,
      subject: updated.subject,
    };
  };
};
