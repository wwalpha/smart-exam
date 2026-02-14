import type { SubjectId } from './subject';

export type KanjiUnderlineSpec = {
  type: 'promptSpan';
  /** JavaScript 文字インデックス（UTF-16 code unit 基準） */
  start: number;
  /** 文字数（UTF-16 code unit 基準） */
  length: number;
};

export type KanjiQuestionStatus = 'DRAFT' | 'GENERATED' | 'VERIFIED' | 'ERROR';

export type KanjiAiMeta = {
  model: string;
  promptVersion: string;
  generatedAt: string;
  rawHash?: string;
};

export type KanjiErrorMeta = {
  code: string;
  message: string;
  at: string;
};

/**
 * 漢字問題（本文中の読み(ひらがな)を下線にする用途）
 */
export type KanjiQuestion = {
  id: string;
  subject: SubjectId;

  promptText: string;
  answerKanji: string;

  readingHiragana?: string;
  underlineSpec?: KanjiUnderlineSpec;
  status?: KanjiQuestionStatus;

  ai?: KanjiAiMeta;
  error?: KanjiErrorMeta;
};

export type KanjiQuestionGenerateReadingResponse = {
  id: string;
  readingHiragana: string;
  underlineSpec: KanjiUnderlineSpec;
  status: KanjiQuestionStatus;
};

export type KanjiQuestionPatchRequest = {
  readingHiragana?: string;
  underlineSpec?: KanjiUnderlineSpec;
  status?: KanjiQuestionStatus;
};

export type KanjiQuestionPatchResponse = KanjiQuestion;

export type KanjiQuestionVerifyResponse = KanjiQuestion;
