import { TestsService } from '../services/TestsService';
import { TestTable } from '../types/db';
import { MaterialSet, CreateMaterialSetRequest } from './repo.types';
import { randomUUID } from 'crypto';
import { DateUtils } from '@/lib/dateUtils';

export const MaterialRepository = {
  createMaterialSet: async (data: CreateMaterialSetRequest): Promise<MaterialSet> => {
    const now = DateUtils.now();
    const id = randomUUID();
    
    const item: MaterialSet = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const dbItem: TestTable = {
      testId: id,
      subjectId: data.subject,
      title: data.name,
      description: data.description,
      questionCount: 0,
      grade: data.grade,
      provider: data.provider,
      testType: data.testType,
      unit: data.unit,
      course: data.course,
      keywords: data.keywords,
      date: data.date,
      createdAt: now,
      updatedAt: now,
    };

    await TestsService.create(dbItem);

    return item;
  },

  getMaterialSet: async (id: string): Promise<MaterialSet | null> => {
    const dbItem = await TestsService.get(id);
    
    if (!dbItem) return null;
    
    return {
      id: dbItem.testId,
      name: dbItem.title,
      subject: dbItem.subjectId,
      grade: dbItem.grade,
      provider: dbItem.provider,
      testType: dbItem.testType,
      unit: dbItem.unit,
      course: dbItem.course,
      description: dbItem.description,
      keywords: dbItem.keywords,
      date: dbItem.date,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    };
  },

  listMaterialSets: async (): Promise<MaterialSet[]> => {
    const items = await TestsService.list();

    return items.map(dbItem => ({
      id: dbItem.testId,
      name: dbItem.title,
      subject: dbItem.subjectId,
      grade: dbItem.grade,
      provider: dbItem.provider,
      testType: dbItem.testType,
      unit: dbItem.unit,
      course: dbItem.course,
      description: dbItem.description,
      keywords: dbItem.keywords,
      date: dbItem.date,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    }));
  }
};
