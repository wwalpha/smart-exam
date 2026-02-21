import type { CreateQuestionRequest, Question, UpdateQuestionRequest } from '@smart-exam/api-types';

export type MaterialDetailsService = {
  listMaterialDetails: (materialId: string) => Promise<Question[]>;
  registMaterialDetail: (data: CreateQuestionRequest & { materialId: string }) => Promise<Question>;
  getMaterialDetail: (questionId: string) => Promise<Question | null>;
  updateMaterialDetail: (questionId: string, updates: Partial<UpdateQuestionRequest>) => Promise<Question | null>;
  deleteMaterialDetail: (questionId: string) => Promise<boolean>;
};
