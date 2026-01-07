export const normalizeQuestionNumber = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const replaced = trimmed
    .replace(/[（）()]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');

  // 例: 1-8, 1-8-1, 1-8-A (末尾のみ英字1文字を許可)
  if (!/^\d+(?:-\d+)*(?:-[A-Za-z])?$/.test(replaced)) return null;

  const parts = replaced.split('-').filter((p) => p.length > 0);
  const last = parts.at(-1) ?? '';
  if (/^[A-Za-z]$/.test(last)) {
    return [...parts.slice(0, -1), last.toUpperCase()].join('-');
  }
  return parts.join('-');
};

export const compareQuestionNumber = (a: string, b: string): number => {
  const parse = (s: string): { nums: number[]; suffix: string | null } => {
    const parts = s.split('-').filter((p) => p.length > 0);
    const last = parts.at(-1) ?? '';
    if (/^[A-Za-z]$/.test(last)) {
      return {
        nums: parts.slice(0, -1).map((x) => Number.parseInt(x, 10)).map((n) => (Number.isFinite(n) ? n : 0)),
        suffix: last.toUpperCase(),
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
  return pa.suffix.localeCompare(pb.suffix);
};
