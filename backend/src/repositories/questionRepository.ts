import { QuestionsService } from '../services/QuestionsService';
import { TestsService } from '../services/TestsService';
import { QuestionTable } from '../types/db';
import { Question, CreateQuestionRequest, UpdateQuestionRequest } from './repo.types';
import { createUuid } from '@/lib/uuid';
import { DateUtils } from '@/lib/dateUtils';
import type { QuestionSearchResult, SearchQuestionsRequest } from '@smart-exam/api-types';

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
  },

  searchQuestions: async (params: SearchQuestionsRequest): Promise<QuestionSearchResult[]> => {
    const keyword = (params.keyword ?? '').trim().toLowerCase();
    const subject = (params.subject ?? '').trim().toLowerCase();

    const [questions, materialSets] = await Promise.all([QuestionsService.scanAll(), TestsService.list()]);
    const materialById = new Map(materialSets.map((x) => [x.testId, x] as const));

    const filtered = questions.filter((q) => {
      if (subject && String(q.subjectId ?? '').toLowerCase() !== subject) return false;
      if (!keyword) return true;

      const haystack = [q.displayLabel, q.canonicalKey, q.category]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(' ')
        .toLowerCase();

      const tagText = Array.isArray(q.tags) ? q.tags.join(' ').toLowerCase() : '';

      return haystack.includes(keyword) || tagText.includes(keyword);
    });

    return filtered.map((q): QuestionSearchResult => {
      const material = materialById.get(q.testId);
      return {
        id: q.questionId,
        subject: q.subjectId,
        unit: material?.unit ?? q.category ?? '',
        questionText: q.displayLabel || q.canonicalKey,
        sourceMaterialId: q.testId,
        sourceMaterialName: material?.title ?? '',
      };
    });
  },
};
