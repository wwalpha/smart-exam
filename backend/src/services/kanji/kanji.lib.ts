export type KanjiUnderlineSpec = { type: 'promptSpan'; start: number; length: number };

// 内部で利用する補助処理を定義する
const isHiraganaOnly = (s: string): boolean => {
  // ぁ-ゖ: ひらがな、ー: 長音記号
  return /^[ぁ-ゖー]+$/.test(s);
};

// 公開するサービス処理を定義する
export const computeKanjiQuestionFields = (params: {
  question: string;
  readingHiragana: string;
}): { readingHiragana: string; underlineSpec: KanjiUnderlineSpec } => {
  // 処理で使う値を準備する
  const question = String(params.question ?? '').trim();
  // 処理で使う値を準備する
  const readingHiragana = String(params.readingHiragana ?? '').trim();

  // 条件に応じて処理を分岐する
  if (!question) throw new Error('question is empty');
  // 条件に応じて処理を分岐する
  if (!readingHiragana) throw new Error('readingHiragana is empty');
  // 条件に応じて処理を分岐する
  if (!isHiraganaOnly(readingHiragana)) throw new Error('readingHiragana must be hiragana only');

  // 処理で使う値を準備する
  const startIndex = question.indexOf(readingHiragana);
  // 条件に応じて処理を分岐する
  if (startIndex < 0) {
    throw new Error('readingHiragana is not found in question');
  }

  // 処理結果を呼び出し元へ返す
  return {
    readingHiragana,
    underlineSpec: { type: 'promptSpan', start: startIndex, length: readingHiragana.length },
  };
};
