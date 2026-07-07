import { compareQuestionNumber, normalizeQuestionNumber } from './questionNumber';

export type ParsedQuestionBulkInputItem = {
  canonicalKey: string;
  correctAnswer?: string;
};

export type ParseQuestionBulkInputResult =
  | { ok: true; items: ParsedQuestionBulkInputItem[] }
  | { ok: false; error: string };

const hasAnswerDelimiter = (value: string): boolean => /[:：]/.test(value);

const findAnswerDelimiterIndex = (value: string): number => {
  const halfWidthIndex = value.indexOf(':');
  const fullWidthIndex = value.indexOf('：');
  if (halfWidthIndex === -1) return fullWidthIndex;
  if (fullWidthIndex === -1) return halfWidthIndex;
  return Math.min(halfWidthIndex, fullWidthIndex);
};

const normalizeOrError = (value: string): string | null => {
  const normalized = normalizeQuestionNumber(value);
  if (!normalized) return null;
  return normalized;
};

const validateDuplicate = (items: ParsedQuestionBulkInputItem[]): string | null => {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.canonicalKey)) {
      return `同じ問題番号が重複しています: ${item.canonicalKey}`;
    }
    seen.add(item.canonicalKey);
  }
  return null;
};

export const parseQuestionBulkInput = (input: string): ParseQuestionBulkInputResult => {
  if (!hasAnswerDelimiter(input)) {
    const items = input
      .split(/[\s,]+/)
      .map((value) => normalizeQuestionNumber(value))
      .filter((value): value is string => typeof value === 'string')
      .sort(compareQuestionNumber)
      .map((canonicalKey) => ({ canonicalKey }));

    const duplicateError = validateDuplicate(items);
    if (duplicateError) return { ok: false, error: duplicateError };
    return { ok: true, items };
  }

  const items: ParsedQuestionBulkInputItem[] = [];
  const lines = input.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index]?.trim() ?? '';
    if (!line) continue;

    const delimiterIndex = findAnswerDelimiterIndex(line);
    if (delimiterIndex === -1) {
      const canonicalKey = normalizeOrError(line);
      if (!canonicalKey) {
        return { ok: false, error: `${lineNumber}行目の問題番号が正しくありません` };
      }
      items.push({ canonicalKey });
      continue;
    }

    const rawNumber = line.slice(0, delimiterIndex).trim();
    const correctAnswer = line.slice(delimiterIndex + 1).trim();
    if (!rawNumber) {
      return { ok: false, error: `${lineNumber}行目の問題番号が空です` };
    }
    if (!correctAnswer) {
      return { ok: false, error: `${lineNumber}行目の答えが空です` };
    }

    const canonicalKey = normalizeOrError(rawNumber);
    if (!canonicalKey) {
      return { ok: false, error: `${lineNumber}行目の問題番号が正しくありません` };
    }
    items.push({ canonicalKey, correctAnswer });
  }

  const duplicateError = validateDuplicate(items);
  if (duplicateError) return { ok: false, error: duplicateError };
  return { ok: true, items: items.sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey)) };
};
