export const toSortNumber = (canonicalKey: string): number => {
  const head = canonicalKey.split('-')[0] ?? '';
  const value = Number.parseInt(head, 10);
  return Number.isFinite(value) ? value : 0;
};
