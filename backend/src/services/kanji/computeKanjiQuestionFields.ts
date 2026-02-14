export type KanjiUnderlineSpec = { type: 'promptSpan'; start: number; length: number };

const isHiraganaOnly = (s: string): boolean => {
  // ぁ-ゖ: ひらがな、ー: 長音記号
  return /^[ぁ-ゖー]+$/.test(s);
};

export const computeKanjiQuestionFields = (params: {
  question: string;
  readingHiragana: string;
}): { readingHiragana: string; underlineSpec: KanjiUnderlineSpec } => {
  const question = String(params.question ?? '').trim();
  const readingHiragana = String(params.readingHiragana ?? '').trim();

  if (!question) throw new Error('question is empty');
  if (!readingHiragana) throw new Error('readingHiragana is empty');
  if (!isHiraganaOnly(readingHiragana)) throw new Error('readingHiragana must be hiragana only');

  const startIndex = question.indexOf(readingHiragana);
  if (startIndex < 0) {
    throw new Error('readingHiragana is not found in question');
  }

  return {
    readingHiragana,
    underlineSpec: { type: 'promptSpan', start: startIndex, length: readingHiragana.length },
  };
};
