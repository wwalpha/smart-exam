// canonicalKey の先頭セグメント（例: "12-abc" の "12"）を並び順番号として扱う。
export const toSortNumber = (canonicalKey: string): number => {
  // 先頭の数値候補を取り出す。
  const head = canonicalKey.split('-')[0] ?? '';
  // 10進数として解釈する。
  const value = Number.parseInt(head, 10);
  // 数値化できない場合は 0 を返して末尾扱いにする。
  return Number.isFinite(value) ? value : 0;
};
