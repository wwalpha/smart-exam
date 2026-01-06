import { DateUtils } from '@/lib/dateUtils';

export type ImportedHistoryEntry = {
  startedAtIso: string;
  submittedAtIso: string;
  isCorrect: boolean;
};

const parseOkNg = (raw: string): boolean | null => {
  const s = raw.trim().toUpperCase();
  if (s === 'OK') return true;
  if (s === 'NG') return false;
  return null;
};

const parseYmdToIso = (ymd: string): string | null => {
  return DateUtils.parseYmdSlashToIso(ymd);
};

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
    const dateIso = parseYmdToIso(dateRaw ?? '');
    const okng = parseOkNg(okngRaw);
    if (!dateIso || okng === null) {
      throw new Error('履歴の形式が不正です');
    }
    histories.push({ startedAtIso: dateIso, submittedAtIso: dateIso, isCorrect: okng });
  }

  return { kanji, reading, histories };
};
