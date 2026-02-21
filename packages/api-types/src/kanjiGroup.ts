import type { WordTestSubject } from './wordtest';

/**
 * 漢字グループ（漢字帳）
 */
export type KanjiGroup = {
  /** 漢字グループID */
  id: string;
  /** タイトル */
  title: string;
  /** 科目 */
  subject: WordTestSubject;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
};

/**
 * 漢字グループ内の漢字項目
 */
export type KanjiGroupItem = {
  /** 漢字項目ID */
  id: string;
  /** 漢字グループID */
  groupId: string;
  /** 問題 */
  question: string;
  /** 答え */
  answer: string;
};

/** 漢字グループ一覧取得レスポンス */
export type ListKanjiGroupsResponse = {
  /** 漢字グループ一覧 */
  datas: KanjiGroup[];
};

/** 漢字グループ作成リクエスト */
export type CreateKanjiGroupRequest = {
  /** タイトル */
  title: string;
  /** 科目 */
  subject: WordTestSubject;
  /** 漢字項目リスト */
  words: {
    /** 問題文 */
    question: string;
    /** 解答 */
    answer: string;
  }[];
};

/** 漢字グループ作成レスポンス */
export type CreateKanjiGroupResponse = KanjiGroup;
