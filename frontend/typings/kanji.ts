export type Kanji = {
  id: string;
  kanji: string;
  reading?: string; // よみ
  meaning?: string; // 意味
  subject?: '1' | '2' | '3' | '4';
  source?: string; // 出典/メモ
  createdAt: string;
  updatedAt: string;
};
