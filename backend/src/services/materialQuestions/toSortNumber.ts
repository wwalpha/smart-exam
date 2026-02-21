// Module: toSortNumber responsibilities.

/** Converts data with to sort number. */
export const toSortNumber = (canonicalKey: string): number => {
  // 処理で使う値を準備する
  const head = canonicalKey.split('-')[0] ?? '';
  // 処理で使う値を準備する
  const value = Number.parseInt(head, 10);
  // 処理結果を呼び出し元へ返す
  return Number.isFinite(value) ? value : 0;
};
