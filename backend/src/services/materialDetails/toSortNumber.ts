const normalizeDigits = (raw: string): string => {
  return raw.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
};

export const toSortNumber = (canonicalKey: string): number => {
  const normalized = normalizeDigits(String(canonicalKey ?? ''));
  const matched = normalized.match(/\d+/);
  if (!matched) return Number.MAX_SAFE_INTEGER;

  const numberValue = Number(matched[0]);
  if (!Number.isFinite(numberValue)) return Number.MAX_SAFE_INTEGER;

  return numberValue;
};
