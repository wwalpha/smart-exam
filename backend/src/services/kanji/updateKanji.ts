import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { computeKanjiQuestionFields } from './kanji.lib';
import type { KanjiService, UpdateKanjiData } from './kanji.types';

const resolveKanjiQuestionFields = (nextQuestion: string, nextAnswer: string): { question: string; answer: string } => {
  const question = String(nextQuestion ?? '').trim();
  const answer = String(nextAnswer ?? '').trim();
  if (!question || !answer) {
    throw new Error('question/answer is missing');
  }
  return { question, answer };
};

const regenerateKanjiFields = async (repositories: Repositories, id: string, question: string, answer: string) => {
  const bulk = await repositories.bedrock.generateKanjiQuestionReadingsBulk({
    items: [{ id, question, answer }],
  });
  const raw = bulk.items.find((x) => x.id === id);
  if (!raw) throw new Error('読み生成に失敗しました: 結果が返りませんでした');

  return computeKanjiQuestionFields({
    question,
    readingHiragana: String(raw.readingHiragana ?? '').trim(),
  });
};

export const createUpdateKanji = (repositories: Repositories): KanjiService['updateKanji'] => {
  return async (id: string, data: UpdateKanjiData): Promise<Kanji | null> => {
    const existing = await repositories.kanji.get(id);
    if (!existing) return null;

    const nextQuestion = data.kanji !== undefined ? data.kanji : String(existing.question ?? '');
    const nextAnswer = data.reading !== undefined ? data.reading : String(existing.answer ?? '');

    const shouldRegenerateKanjiQuestionFields =
      (data.kanji !== undefined || data.reading !== undefined) &&
      Boolean(existing.readingHiragana || existing.underlineSpec);

    const kanjiQuestionFields = shouldRegenerateKanjiQuestionFields
      ? resolveKanjiQuestionFields(nextQuestion, nextAnswer)
      : null;

    const regenerated =
      shouldRegenerateKanjiQuestionFields && kanjiQuestionFields
        ? await regenerateKanjiFields(repositories, id, kanjiQuestionFields.question, kanjiQuestionFields.answer)
        : null;

    const updated = await repositories.kanji.update(id, {
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
