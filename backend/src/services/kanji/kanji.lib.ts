import { DateUtils } from '@/lib/dateUtils';

import type { KanjiUnderlineSpec } from './kanji.types';
import type { ImportedHistoryEntry } from './kanji.types';

// 内部で利用する補助処理を定義する
const isHiraganaOnly = (s: string): boolean => {
  // ぁ-ゖ: ひらがな、ー: 長音記号
  return /^[ぁ-ゖー]+$/.test(s);
};

// 内部で利用する補助処理を定義する
const isKanaOnly = (s: string): boolean => {
  // ぁ-ゖ: ひらがな、ァ-ヶ: カタカナ、ー: 長音記号
  return /^[ぁ-ゖァ-ヶー]+$/.test(s);
};

// 内部で利用する補助処理を定義する
const toHiragana = (s: string): string => {
  return s.replace(/[ァ-ヶ]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0x60);
  });
};

// 内部で利用する補助処理を定義する
const toKatakana = (s: string): string => {
  return s.replace(/[ぁ-ゖ]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) + 0x60);
  });
};

// 公開するサービス処理を定義する
export const computeKanjiQuestionFields = (params: {
  question: string;
  readingHiragana: string;
}): { readingHiragana: string; underlineSpec: KanjiUnderlineSpec } => {
  // 処理で使う値を準備する
  const question = String(params.question ?? '').trim();
  // 処理で使う値を準備する
  const readingRaw = String(params.readingHiragana ?? '').trim();

  // 条件に応じて処理を分岐する
  if (!question) throw new Error('question is empty');
  // 条件に応じて処理を分岐する
  if (!readingRaw) throw new Error('readingHiragana is empty');
  // 条件に応じて処理を分岐する
  if (!isKanaOnly(readingRaw)) throw new Error('readingHiragana must be kana only');
  // 条件に応じて処理を分岐する
  const readingHiragana = toHiragana(readingRaw);
  // 条件に応じて処理を分岐する
  if (!isHiraganaOnly(readingHiragana)) throw new Error('readingHiragana must be hiragana only');

  // カタカナ/ひらがなの表記ゆれがあっても位置を特定できるよう候補を順に照合する。
  const searchCandidates = Array.from(
    new Set([readingRaw, readingHiragana, toKatakana(readingRaw), toKatakana(readingHiragana)]),
  ).filter((candidate) => candidate.length > 0);

  let resolvedStartIndex = -1;
  let resolvedLength = readingHiragana.length;
  for (const candidate of searchCandidates) {
    const index = question.indexOf(candidate);
    if (index < 0) continue;
    resolvedStartIndex = index;
    resolvedLength = candidate.length;
    break;
  }
  // 条件に応じて処理を分岐する
  if (resolvedStartIndex < 0) {
    throw new Error('readingHiragana is not found in question');
  }

  // 処理結果を呼び出し元へ返す
  return {
    readingHiragana,
    underlineSpec: {
      type: 'promptSpan',
      start: resolvedStartIndex,
      length: resolvedLength,
    },
  };
};

// 内部で利用する補助処理を定義する
const parseOkNg = (raw: string): boolean | null => {
  const s = raw.trim().toUpperCase();
  if (s === 'OK') return true;
  if (s === 'NG') return false;
  return null;
};

// 内部で利用する補助処理を定義する
const parseHistoryTokens = (tokens: string[]): ImportedHistoryEntry[] => {
  const histories: ImportedHistoryEntry[] = [];
  for (const token of tokens) {
    if (!token) continue;
    const [dateRaw, okngRaw = ''] = token.split(',');
    let ymd = '';
    try {
      ymd = DateUtils.formatYmd(dateRaw ?? '') ?? '';
    } catch {
      ymd = '';
    }
    const okng = parseOkNg(okngRaw);
    if (!ymd || okng === null) {
      throw new Error('履歴の形式が不正です');
    }
    histories.push({ submittedDate: ymd, isCorrect: okng });
  }
  return histories;
};

export const parsePipeLine = (line: string): { kanji: string; reading: string; histories: ImportedHistoryEntry[] } => {
  const parts = line.split('|').map((x) => x.trim());
  if (parts.length < 2) {
    throw new Error('フォーマットが不正です');
  }

  const kanji = parts[0];
  const reading = parts[1];
  const histories = parseHistoryTokens(parts.slice(2));

  return { kanji, reading, histories };
};

export const parsePipeQuestionLine = (
  line: string,
): {
  question: string;
  answer: string;
  histories: ImportedHistoryEntry[];
} => {
  const parts = line.split('|').map((x) => x.trim());
  if (parts.length < 2) {
    throw new Error('フォーマットが不正です');
  }

  const question = parts[0];
  const answer = parts[1];
  const histories = parseHistoryTokens(parts.slice(2));

  return { question, answer, histories };
};
