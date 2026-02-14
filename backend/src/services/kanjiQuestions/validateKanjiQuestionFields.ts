export const validateKanjiQuestionFields = (params: {
  question: string;
  readingHiragana: string;
  underlineSpec: { type: string; start: number; length: number };
}): { readingHiragana: string; underlineSpec: { type: 'promptSpan'; start: number; length: number } } => {
  const question = String(params.question ?? '').trim();
  const readingHiragana = String(params.readingHiragana ?? '').trim();

  const isHiraganaOnly = (s: string): boolean => {
    // ぁ-ゖ: ひらがな、ー: 長音記号
    return /^[ぁ-ゖー]+$/.test(s);
  };

  if (!question) throw new Error('question is empty');
  if (!readingHiragana) throw new Error('readingHiragana is empty');
  if (!isHiraganaOnly(readingHiragana)) throw new Error('readingHiragana must be hiragana only');

  const underlineSpec = params.underlineSpec;
  if (!underlineSpec || underlineSpec.type !== 'promptSpan') {
    throw new Error('underlineSpec.type must be promptSpan');
  }
  if (!Number.isInteger(underlineSpec.start) || !Number.isInteger(underlineSpec.length)) {
    throw new Error('underlineSpec.start/length must be int');
  }
  if (underlineSpec.start < 0 || underlineSpec.length <= 0) {
    throw new Error('underlineSpec.start/length out of range');
  }
  if (underlineSpec.start + underlineSpec.length > question.length) {
    throw new Error('underlineSpec out of question range');
  }

  const slice = question.slice(underlineSpec.start, underlineSpec.start + underlineSpec.length);
  if (slice !== readingHiragana) {
    throw new Error('underlineSpec does not match readingHiragana');
  }

  return {
    readingHiragana,
    underlineSpec: { type: 'promptSpan' as const, start: underlineSpec.start, length: underlineSpec.length },
  };
};
