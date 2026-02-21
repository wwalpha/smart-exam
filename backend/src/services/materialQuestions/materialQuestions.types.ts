import type {
  CreateQuestionRequest,
  Question,
  QuestionListResponse,
  QuestionSearchResult,
  SearchQuestionsRequest,
} from '@smart-exam/api-types';

export type MaterialQuestionsService = {
  listQuestions: (materialId: string) => Promise<QuestionListResponse['datas']>;
  createQuestion: (data: CreateQuestionRequest & { materialId: string }) => Promise<Question>;
  updateQuestion: (
    materialId: string,
    questionId: string,
    updates: Partial<CreateQuestionRequest>,
  ) => Promise<Question | null>;
  deleteQuestion: (materialId: string, questionId: string) => Promise<boolean>;
  searchQuestions: (params: SearchQuestionsRequest) => Promise<QuestionSearchResult[]>;
  setQuestionChoice: (params: { materialId: string; questionId: string; isCorrect: boolean }) => Promise<boolean>;
  applyChoices: (params: { materialId: string; baseDateYmd: string }) => Promise<void>;
};
