import type {
  CreateQuestionRequest,
  Question,
  QuestionListResponse,
  QuestionSearchResult,
  SearchQuestionsRequest,
} from '@smart-exam/api-types';

export type MaterialQuestionsService = {
  // 教材IDに紐づく設問一覧を返す。
  listQuestions: (materialId: string) => Promise<QuestionListResponse['datas']>;
  // 指定教材に新しい設問を作成する。
  createQuestion: (data: CreateQuestionRequest & { materialId: string }) => Promise<Question>;
  // 指定設問の内容を部分更新する。
  updateQuestion: (
    materialId: string,
    questionId: string,
    updates: Partial<CreateQuestionRequest>,
  ) => Promise<Question | null>;
  // 指定設問を削除する。
  deleteQuestion: (materialId: string, questionId: string) => Promise<boolean>;
  // 条件に一致する設問を横断検索する。
  searchQuestions: (params: SearchQuestionsRequest) => Promise<QuestionSearchResult[]>;
  // 教材配下の設問に対する正誤選択を一括更新する。
  setMaterialChoices: (params: {
    materialId: string;
    items: Array<{ questionId: string; isCorrect: boolean; correctAnswer?: string }>;
  }) => Promise<boolean>;
  // 選択結果を復習候補へ反映する。
  applyChoices: (params: { materialId: string; baseDateYmd: string }) => Promise<void>;
};
