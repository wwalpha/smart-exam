export const normalizeQuestionNumber = (raw: string): string | null => {
  const trimmed = raw.trim();
  // 空文字は無効な問題番号として扱う
  if (!trimmed) return null;

  const replaced = trimmed
    .replace(/[（）()]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');

  // 例: 1-8, 1-8-1, 1-8-A, 1-8-あ, 1-8-あい, 1-9-カナ
  // 先頭〜途中は数値のみ、末尾は「数値」または「任意の文字列」を許可
  // 末尾にサフィックスを許容するのは、教材の表記揺れ（A/あ/カナなど）を扱うため
  if (!/^\d+(?:-\d+)*(?:-[^-\s]+)?$/.test(replaced)) return null;

  const parts = replaced.split('-').filter((p) => p.length > 0);
  const last = parts.at(-1) ?? '';
  // 英字1文字サフィックスは大文字へ正規化（並び順・同一視のため）
  if (/^[A-Za-z]$/.test(last)) {
    return [...parts.slice(0, -1), last.toUpperCase()].join('-');
  }
  return parts.join('-');
};

export const compareQuestionNumber = (a: string, b: string): number => {
  const parse = (s: string): { nums: number[]; suffix: string | null } => {
    const parts = s.split('-').filter((p) => p.length > 0);
    const last = parts.at(-1) ?? '';
    const isLastNumeric = /^\d+$/.test(last);
    if (!isLastNumeric) {
      // 末尾が数値でない場合はサフィックスとして扱い、数値部分とは別に比較する
      const normalizedSuffix = /^[A-Za-z]+$/.test(last) ? last.toUpperCase() : last;
      return {
        nums: parts
          .slice(0, -1)
          .map((x) => Number.parseInt(x, 10))
          .map((n) => (Number.isFinite(n) ? n : 0)),
        suffix: normalizedSuffix,
      };
    }
    return {
      nums: parts.map((x) => Number.parseInt(x, 10)).map((n) => (Number.isFinite(n) ? n : 0)),
      suffix: null,
    };
  };

  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.nums.length, pb.nums.length);

  for (let i = 0; i < len; i += 1) {
    const av = pa.nums[i] ?? 0;
    const bv = pb.nums[i] ?? 0;
    if (av !== bv) return av - bv;
  }

  if (pa.suffix === pb.suffix) return 0;
  if (pa.suffix === null) return -1;
  if (pb.suffix === null) return 1;
  return pa.suffix.localeCompare(pb.suffix, 'ja');
};
