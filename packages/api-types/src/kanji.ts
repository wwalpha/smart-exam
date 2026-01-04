/**
 * 漢字データ
 */
export type Kanji = {
  /** ID */
  id: string;
  /** 漢字 */
  kanji: string;
  /** よみ */
  reading?: string;
  /** 意味 */
  meaning?: string;
  /** 科目（国語/社会など） */
  subject?: string;
  /** 出典/メモ */
  source?: string;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
  /** 更新日時 (ISO 8601) */
  updatedAt: string;
};

/** 漢字一覧取得レスポンス */
export type KanjiListResponse = {
  /** 漢字リスト */
  items: Kanji[];
  /** 総件数 */
  total: number;
  /** 次ページ用カーソル */
  cursor?: string;
};

/** `POST /kanji/search` */
export type SearchKanjiRequest = {
  q?: string;
  reading?: string;
  subject?: string;
  limit?: number;
  cursor?: string;
};

/** `POST /kanji/search` */
export type SearchKanjiResponse = KanjiListResponse;

/** `GET /kanji/:kanjiId` */
export type GetKanjiParams = {
  kanjiId: string;
};

/** `GET /kanji/:kanjiId` */
export type GetKanjiResponse = Kanji;

/** 漢字作成リクエスト */
export type CreateKanjiRequest = {
  /** 漢字 */
  kanji: string;
  /** よみ */
  reading?: string;
  /** 意味 */
  meaning?: string;
  /** 科目 */
  subject?: string;
  /** 出典 */
  source?: string;
};

/** 漢字作成レスポンス */
export type CreateKanjiResponse = Kanji;

/** 漢字更新リクエスト */
export type UpdateKanjiRequest = Partial<CreateKanjiRequest>;

/** `PATCH /kanji/:kanjiId` */
export type UpdateKanjiParams = {
  kanjiId: string;
};

/** `PATCH /kanji/:kanjiId` */
export type UpdateKanjiResponse = Kanji;

/** `DELETE /kanji/:kanjiId` */
export type DeleteKanjiParams = {
  kanjiId: string;
};

/** `DELETE /kanji/:kanjiId` */
export type DeleteKanjiResponse = Record<string, never>;

/** 漢字インポートリクエスト */
export type ImportKanjiRequest = {
  /** CSV/TSV等のファイル内容 */
  fileContent: string;
  /** インポートモード (SKIP: 重複スキップ, UPDATE: 上書き) */
  mode: 'SKIP' | 'UPDATE';
  /** 科目（指定時は全行に適用） */
  subject?: string;
};

/** 漢字インポートレスポンス */
export type ImportKanjiResponse = {
  /** 成功件数 */
  successCount: number;
  /** 重複件数 */
  duplicateCount: number;
  /** エラー件数 */
  errorCount: number;
  /** エラー詳細 */
  errors: {
    /** 行番号 */
    line: number;
    /** 内容 */
    content: string;
    /** エラー理由 */
    reason: string;
  }[];
};
