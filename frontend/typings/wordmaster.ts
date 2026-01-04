import type { WordTestSubject } from './wordtest';

// 単語グループ（単語帳）
export type WordGroup = {
  // グループID
  id: string;
  // タイトル
  title: string;
  // 科目
  subject: WordTestSubject;
  // 作成日時
  created_at: string;
};

// 単語
export type Word = {
  // 単語ID
  id: string;
  // グループID
  group_id: string;
  // 問題
  question: string;
  // 答え
  answer: string;
};


