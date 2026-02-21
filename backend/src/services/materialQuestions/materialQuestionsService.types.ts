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
  updateQuestion: (questionId: string, updates: Partial<CreateQuestionRequest>) => Promise<Question | null>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
  searchQuestions: (params: SearchQuestionsRequest) => Promise<QuestionSearchResult[]>;
  markQuestionCorrect: (questionId: string) => Promise<boolean>;
  markQuestionIncorrect: (questionId: string) => Promise<boolean>;
  recalculateCandidatesForMaterial: (params: { materialId: string; registeredDate: string }) => Promise<void>;
};
