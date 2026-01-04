import { QuestionsService } from '../services/QuestionsService';
import { QuestionTable } from '../types/db';
import { Question, CreateQuestionRequest, UpdateQuestionRequest } from './repo.types';
import { createUuid } from '@/lib/uuid';
import { DateUtils } from '@/lib/dateUtils';

export const QuestionRepository = {
  createQuestion: async (data: CreateQuestionRequest & { materialSetId: string }): Promise<Question> => {
    const now = DateUtils.now();
    const id = createUuid();
    
    const item: Question = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const dbItem: QuestionTable = {
      questionId: id,
      testId: data.materialSetId,
      subjectId: data.subject,
      number: 0, // Default number
      canonicalKey: data.canonicalKey,
      displayLabel: data.displayLabel,
      category: data.category,
      tags: data.tags,
      createdAt: now,
      updatedAt: now,
    };

    await QuestionsService.create(dbItem);

    return item;
  },

  listQuestions: async (materialSetId: string): Promise<Question[]> => {
    const items = await QuestionsService.listByTestId(materialSetId);

    return items.map(dbItem => ({
      id: dbItem.questionId,
      materialSetId: dbItem.testId,
      canonicalKey: dbItem.canonicalKey,
      displayLabel: dbItem.displayLabel,
      subject: dbItem.subjectId,
      category: dbItem.category,
      tags: dbItem.tags,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    }));
  },

  updateQuestion: async (id: string, data: UpdateQuestionRequest): Promise<Question | null> => {
    const now = DateUtils.now();
    
    const result = await QuestionsService.update(id, {
      ...data,
      updatedAt: now,
    });

    if (!result) return null;

    const dbItem = result;
    return { 
      id: dbItem.questionId, 
      materialSetId: dbItem.testId,
      canonicalKey: dbItem.canonicalKey,
      displayLabel: dbItem.displayLabel,
      subject: dbItem.subjectId,
      category: dbItem.category,
      tags: dbItem.tags,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    };
  }
};
