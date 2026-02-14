// Module: importUtils responsibilities.

import { DateUtils } from '@/lib/dateUtils';


/** Type definition for ImportedHistoryEntry. */
export type ImportedHistoryEntry = {
  /** 実施日 (YYYY-MM-DD) */
  submittedDate: string;
  isCorrect: boolean;
};

const parseOkNg = (raw: string): boolean | null => {
  const s = raw.trim().toUpperCase();
  if (s === 'OK') return true;
  if (s === 'NG') return false;
  return null;
};

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

// const parseYmdToIso = (ymd: string): string | null => {
//   return DateUtils.parseYmdSlashToIso(ymd);
// };

/** parsePipeLine. */
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

/** parsePipeQuestionLine. */
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
