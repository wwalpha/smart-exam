import type { WordTestSubject } from './wordtest';

/**
 * 単語グループ（単語帳）
 */
export type WordGroup = {
  /** グループID */
  id: string;
  /** タイトル */
  title: string;
  /** 科目 */
  subject: WordTestSubject;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
};

/**
 * 単語
 */
export type Word = {
  /** 単語ID */
  id: string;
  /** グループID */
  groupId: string;
  /** 問題 */
  question: string;
  /** 答え */
  answer: string;
};

/** 単語グループ一覧取得レスポンス */
export type ListWordGroupsResponse = {
  datas: WordGroup[];
};

/** 単語グループ作成リクエスト */
export type CreateWordGroupRequest = {
  /** タイトル */
  title: string;
  /** 科目 */
  subject: WordTestSubject;
  /** 単語リスト */
  words: { question: string; answer: string }[];
};

/** 単語グループ作成レスポンス */
export type CreateWordGroupResponse = WordGroup;
