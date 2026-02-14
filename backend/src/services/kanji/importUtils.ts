import { DateUtils } from '@/lib/dateUtils';

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

// const parseYmdToIso = (ymd: string): string | null => {
//   return DateUtils.parseYmdSlashToIso(ymd);
// };

export const parsePipeLine = (line: string): { kanji: string; reading: string; histories: ImportedHistoryEntry[] } => {
  const parts = line.split('|').map((x) => x.trim());
  if (parts.length < 2) {
    throw new Error('フォーマットが不正です');
  }

  const kanji = parts[0];
  const reading = parts[1];

  const histories: ImportedHistoryEntry[] = [];
  for (const token of parts.slice(2)) {
    if (!token) continue;
    const [dateRaw, okngRaw = ''] = token.split(',');
    // YYYY-MM-DD かチェック (DateUtils.parseYmdSlashToIso 等は使わず、入力値をそのまま扱うか、フォーマット変換する)
    // ここでは単純に YYYY/MM/DD -> YYYY-MM-DD 置換などを行う
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

  return { kanji, reading, histories };
};

export const parsePipeQuestionLine = (
  line: string,
): {
  promptText: string;
  answerKanji: string;
  histories: ImportedHistoryEntry[];
} => {
  const parts = line.split('|').map((x) => x.trim());
  if (parts.length < 2) {
    throw new Error('フォーマットが不正です');
  }

  const promptText = parts[0];
  const answerKanji = parts[1];

  const histories: ImportedHistoryEntry[] = [];
  for (const token of parts.slice(2)) {
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

  return { promptText, answerKanji, histories };
};
