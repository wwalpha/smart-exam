// Module: importUtils responsibilities.

import { DateUtils } from '@/lib/dateUtils';
import type { ImportedHistoryEntry } from './kanji.types';

export type { ImportedHistoryEntry } from './kanji.types';

// 内部で利用する補助処理を定義する
const parseOkNg = (raw: string): boolean | null => {
  // 処理で使う値を準備する
  const s = raw.trim().toUpperCase();
  // 条件に応じて処理を分岐する
  if (s === 'OK') return true;
  // 条件に応じて処理を分岐する
  if (s === 'NG') return false;
  // 処理結果を呼び出し元へ返す
  return null;
};

// 内部で利用する補助処理を定義する
const parseHistoryTokens = (tokens: string[]): ImportedHistoryEntry[] => {
  const histories: ImportedHistoryEntry[] = [];
  // 対象データを順番に処理する
  for (const token of tokens) {
    // 条件に応じて処理を分岐する
    if (!token) continue;
    const [dateRaw, okngRaw = ''] = token.split(',');
    // 後続処理で更新する値を初期化する
    let ymd = '';
    // 例外が発生しうる処理を実行する
    try {
      // 値を代入する
      ymd = DateUtils.formatYmd(dateRaw ?? '') ?? '';
    } catch {
      // 値を代入する
      ymd = '';
    }
    // 処理で使う値を準備する
    const okng = parseOkNg(okngRaw);
    // 条件に応じて処理を分岐する
    if (!ymd || okng === null) {
      throw new Error('履歴の形式が不正です');
    }
    histories.push({ submittedDate: ymd, isCorrect: okng });
  }
  // 処理結果を呼び出し元へ返す
  return histories;
};

// const parseYmdToIso = (ymd: string): string | null => {
//   return DateUtils.parseYmdSlashToIso(ymd);
// };

/** parsePipeLine. */
export const parsePipeLine = (line: string): { kanji: string; reading: string; histories: ImportedHistoryEntry[] } => {
  // 処理で使う値を準備する
  const parts = line.split('|').map((x) => x.trim());
  // 条件に応じて処理を分岐する
  if (parts.length < 2) {
    throw new Error('フォーマットが不正です');
  }

  // 処理で使う値を準備する
  const kanji = parts[0];
  // 処理で使う値を準備する
  const reading = parts[1];

  // 処理で使う値を準備する
  const histories = parseHistoryTokens(parts.slice(2));

  // 処理結果を呼び出し元へ返す
  return { kanji, reading, histories };
};

/** parsePipeQuestionLine. */
export const parsePipeQuestionLine = (
  line: string,
): {
  question: string;
  answer: string;
  histories: ImportedHistoryEntry[];
} => {
  // 処理で使う値を準備する
  const parts = line.split('|').map((x) => x.trim());
  // 条件に応じて処理を分岐する
  if (parts.length < 2) {
    throw new Error('フォーマットが不正です');
  }

  // 処理で使う値を準備する
  const question = parts[0];
  // 処理で使う値を準備する
  const answer = parts[1];

  // 処理で使う値を準備する
  const histories = parseHistoryTokens(parts.slice(2));

  // 処理結果を呼び出し元へ返す
  return { question, answer, histories };
};
