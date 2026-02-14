import type { SubjectId } from './subject';

export type KanjiUnderlineSpec = {
  type: 'promptSpan';
  /** JavaScript 文字インデックス（UTF-16 code unit 基準） */
  start: number;
  /** 文字数（UTF-16 code unit 基準） */
  length: number;
};

/**
 * 漢字問題（本文中の読み(ひらがな)を下線にする用途）
 */
export type KanjiQuestion = {
  id: string;
  subject: SubjectId;

  /** 問題文（本文） */
  question: string;
  /** 解答（記入すべき漢字） */
  answer: string;

  readingHiragana?: string;
  underlineSpec?: KanjiUnderlineSpec;
};

export type KanjiQuestionGenerateReadingResponse = {
  id: string;
  readingHiragana: string;
  underlineSpec: KanjiUnderlineSpec;
};

export type KanjiQuestionPatchRequest = {
  readingHiragana?: string;
  underlineSpec?: KanjiUnderlineSpec;
};

export type KanjiQuestionPatchResponse = KanjiQuestion;

export type KanjiQuestionVerifyResponse = KanjiQuestion;
