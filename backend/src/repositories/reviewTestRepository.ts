import { WordTestsService } from '../services/WordTestsService';
import { WordTestTable } from '../types/db';
import { ReviewTest, CreateReviewTestRequest } from './repo.types';
import { randomUUID } from 'crypto';
import { DateUtils } from '@/lib/dateUtils';

export const ReviewTestRepository = {
  createReviewTest: async (data: CreateReviewTestRequest): Promise<ReviewTest> => {
    const now = DateUtils.now();
    const id = randomUUID();
    
    const item: ReviewTest = {
      id,
      testId: id,
      subject: data.subject,
      status: 'IN_PROGRESS',
      itemCount: data.count,
      createdAt: now,
      updatedAt: now,
    };

    const dbItem: WordTestTable = {
      wordTestId: id,
      wordType: 'KANJI',
      count: data.count,
      wordIds: [],
      testId: id,
      subject: data.subject,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    };

    await WordTestsService.create(dbItem);

    return item;
  },

  listReviewTests: async (): Promise<ReviewTest[]> => {
    const items = await WordTestsService.list();
    
    return items.map(dbItem => ({
      id: dbItem.wordTestId,
      testId: dbItem.testId,
      subject: dbItem.subject,
      status: dbItem.status as 'IN_PROGRESS' | 'COMPLETED',
      itemCount: dbItem.count,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    }));
  },

  getReviewTest: async (id: string): Promise<ReviewTest | null> => {
    const dbItem = await WordTestsService.get(id);
    
    if (!dbItem) return null;
    
    return {
      id: dbItem.wordTestId,
      testId: dbItem.testId,
      subject: dbItem.subject,
      status: dbItem.status as 'IN_PROGRESS' | 'COMPLETED',
      itemCount: dbItem.count,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    };
  }
};
