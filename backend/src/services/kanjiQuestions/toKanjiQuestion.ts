import type { KanjiQuestion } from '@smart-exam/api-types';

export const toKanjiQuestion = (dbItem: {
  wordId: string;
  subject: string;
  question: string;
  answer: string;
  readingHiragana?: string;
  underlineSpec?: { type: 'promptSpan'; start: number; length: number };
}): KanjiQuestion => {
  return {
    id: dbItem.wordId,
    subject: dbItem.subject as KanjiQuestion['subject'],
    question: String(dbItem.question ?? ''),
    answer: String(dbItem.answer ?? ''),
    readingHiragana: dbItem.readingHiragana,
    underlineSpec: dbItem.underlineSpec,
  };
};
