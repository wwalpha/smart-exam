import type { SubjectId } from './subject';

/**
 * 漢字データ
 */
export type Kanji = {
  /** ID */
  id: string;
  /** 漢字 */
  kanji: string;
  /** よみ */
  reading: string;
  /** 科目（コード値） */
  subject: SubjectId;
};

/** 漢字問題の下線位置情報 */
export type KanjiUnderlineSpec = {
  /** 下線種別（固定値） */
  type: 'promptSpan';
  /** JavaScript 文字インデックス（UTF-16 code unit 基準） */
  start: number;
  /** 文字数（UTF-16 code unit 基準） */
  length: number;
};

/**
 * 漢字問題（本文中の読み(ひらがな)を下線にする用途）
 */
export type KanjiQuestion = {
  /** 漢字ID */
  id: string;
  /** 科目 */
  subject: SubjectId;

  /** 問題文（本文） */
  question: string;
  /** 解答（記入すべき漢字） */
  answer: string;

  /** 読み（ひらがな） */
  readingHiragana?: string;
  /** 問題文内の下線位置 */
  underlineSpec?: KanjiUnderlineSpec;
};

/** 漢字問題読み生成レスポンス */
export type KanjiQuestionGenerateReadingResponse = {
  /** 漢字ID */
  id: string;
  /** 読み（ひらがな） */
  readingHiragana: string;
  /** 問題文内の下線位置 */
  underlineSpec: KanjiUnderlineSpec;
};

/** 漢字問題更新リクエスト */
export type KanjiQuestionPatchRequest = {
  /** 読み（ひらがな） */
  readingHiragana?: string;
  /** 問題文内の下線位置 */
  underlineSpec?: KanjiUnderlineSpec;
};

/** 漢字問題更新レスポンス */
export type KanjiQuestionPatchResponse = KanjiQuestion;

/** 漢字問題検証レスポンス */
export type KanjiQuestionVerifyResponse = KanjiQuestion;

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
  /** 検索キーワード */
  q?: string;
  /** 読みでの絞り込み */
  reading?: string;
  /** 科目での絞り込み */
  subject?: SubjectId;
  /** 1ページあたりの取得件数 */
  limit?: number;
  /** 次ページ取得用カーソル */
  cursor?: string;
};

/** `POST /kanji/search` */
export type SearchKanjiResponse = KanjiListResponse;

/** `GET /kanji/:kanjiId` */
export type GetKanjiParams = {
  /** 漢字ID */
  kanjiId: string;
};

/** `GET /kanji/:kanjiId` */
export type GetKanjiResponse = Kanji;

/** 漢字作成リクエスト */
export type RegistKanjiRequest = {
  /** 漢字 */
  kanji: string;
  /** よみ */
  reading: string;
  /** 科目 */
  subject: SubjectId;
};

/** 漢字作成レスポンス */
export type RegistKanjiResponse = Kanji;

/** 漢字更新リクエスト */
export type UpdateKanjiRequest = Partial<RegistKanjiRequest>;

/** `PATCH /kanji/:kanjiId` */
export type UpdateKanjiParams = {
  /** 漢字ID */
  kanjiId: string;
};

/** `PATCH /kanji/:kanjiId` */
export type UpdateKanjiResponse = Kanji;

/** `DELETE /kanji/:kanjiId` */
export type DeleteKanjiParams = {
  /** 漢字ID */
  kanjiId: string;
};

/** `DELETE /kanji/:kanjiId` */
export type DeleteKanjiResponse = Record<string, never>;

/** `POST /kanji/deletions` */
export type DeleteManyKanjiRequest = {
  /** 一括削除対象の漢字ID一覧 */
  kanjiIds: string[];
};

/** `POST /kanji/deletions` */
export type DeleteManyKanjiResponse = Record<string, never>;

/** 漢字インポートリクエスト */
export type ImportKanjiRequest = {
  /** CSV/TSV等のファイル内容 */
  fileContent: string;
  /** 科目（全行に適用） */
  subject: SubjectId;
};

/** 漢字インポートレスポンス */
export type ImportKanjiResponse = {
  /** 成功件数 */
  successCount: number;
  /** 重複件数 */
  duplicateCount: number;
  /** エラー件数 */
  errorCount: number;
  /** 作成されたID（DynamoDB上は `wordId`）。必要な場合のみ返す */
  questionIds?: string[];
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
