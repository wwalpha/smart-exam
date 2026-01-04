export type Kanji = {
  id: string;
  kanji: string;
  reading?: string; // よみ
  meaning?: string; // 意味
  subject?: string; // 国語/社会
  source?: string; // 出典/メモ
  createdAt: string;
  updatedAt: string;
};
