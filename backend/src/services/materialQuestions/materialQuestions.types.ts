import type { CreateQuestionRequest, Question, UpdateQuestionRequest } from '@smart-exam/api-types';

export type MaterialQuestionsService = {
  listQuestions: (materialId: string) => Promise<Question[]>;
  registQuestion: (data: CreateQuestionRequest & { materialId: string }) => Promise<Question>;
  getQuestion: (questionId: string) => Promise<Question | null>;
  updateQuestion: (questionId: string, updates: Partial<UpdateQuestionRequest>) => Promise<Question | null>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
};
