export type MaterialSet = {
  id: string;
  name: string;
  subject: string;
  grade?: string;
  provider?: string; // SAPIX, YOTSUYA, etc.
  testType?: string; // 回・テスト名
  unit?: string; // 単元
  course?: string; // コース/クラス
  description?: string; // メモ
  keywords?: string[];
  date: string; // 実施日 YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
};

export type MaterialFile = {
  id: string;
  materialSetId: string;
  filename: string;
  s3Key: string;
  contentType: string;
  fileType: 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER'; // 問題, 解答, 答案
  createdAt: string;
};

export type Question = {
  id: string;
  materialSetId: string;
  canonicalKey: string;
  displayLabel: string;
  subject: string;
  category?: string; // 分野
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateQuestionRequest = {
  canonicalKey: string;
  displayLabel: string;
  subject: string;
  category?: string;
  tags?: string[];
};

export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;
