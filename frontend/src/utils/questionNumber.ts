export const normalizeQuestionNumber = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const replaced = trimmed
    .replace(/[（）()]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');

  if (!/^\d+(?:-\d+)*$/.test(replaced)) return null;
  return replaced;
};

export const compareQuestionNumber = (a: string, b: string): number => {
  const pa = a.split('-').map((x) => Number.parseInt(x, 10));
  const pb = b.split('-').map((x) => Number.parseInt(x, 10));
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i += 1) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av !== bv) return av - bv;
  }

  return 0;
};
