import { TestsService } from '../services/TestsService';
import { TestTable } from '../types/db';
import { MaterialSet, CreateMaterialSetRequest } from './repo.types';
import { DateUtils } from '@/lib/dateUtils';
import type { MaterialFile } from '@smart-exam/api-types';
import { createUuid } from '@/lib/uuid';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/aws';
import { ENV } from '@/lib/env';

export const MaterialRepository = {
  createMaterialSet: async (data: CreateMaterialSetRequest): Promise<MaterialSet> => {
    const now = DateUtils.now();
    const id = createUuid();

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
      yearMonth: data.yearMonth,
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
      yearMonth: dbItem.yearMonth ?? (dbItem.date ? dbItem.date.slice(0, 7) : dbItem.createdAt.slice(0, 7)),
      date: dbItem.date,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    };
  },

  listMaterialSets: async (): Promise<MaterialSet[]> => {
    const items = await TestsService.list();

    return items.map((dbItem) => ({
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
      yearMonth: dbItem.yearMonth ?? (dbItem.date ? dbItem.date.slice(0, 7) : dbItem.createdAt.slice(0, 7)),
      date: dbItem.date,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
    }));
  },

  deleteMaterialSet: async (id: string): Promise<boolean> => {
    const existing = await TestsService.get(id);
    if (!existing) return false;
    await TestsService.delete(id);
    return true;
  },

  listMaterialFiles: async (_materialSetId: string): Promise<MaterialFile[]> => {
    const materialSetId = _materialSetId;
    const bucket = ENV.FILES_BUCKET_NAME;
    if (!bucket) return [];

    const prefix = `materials/${materialSetId}/`;
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      })
    );

    const now = DateUtils.now();
    const objects = response.Contents ?? [];

    const allowedTypes = new Set<MaterialFile['fileType']>(['QUESTION', 'ANSWER', 'GRADED_ANSWER']);

    return objects
      .map((obj) => {
        const key = obj.Key;
        if (!key || key.endsWith('/')) return null;

        const parts = key.split('/');
        // materials/{materialSetId}/{fileType}/{id}-{filename}
        if (parts.length < 4) return null;
        const fileTypeRaw = parts[2] as MaterialFile['fileType'];
        if (!allowedTypes.has(fileTypeRaw)) return null;

        const baseName = parts.slice(3).join('/');
        const dashIndex = baseName.indexOf('-');
        const id = dashIndex > 0 ? baseName.slice(0, dashIndex) : baseName;
        const filename = dashIndex > 0 ? baseName.slice(dashIndex + 1) : baseName;

        const contentType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
        const createdAt = obj.LastModified ? obj.LastModified.toISOString() : now;

        const item: MaterialFile = {
          id,
          materialSetId,
          filename,
          s3Key: key,
          contentType,
          fileType: fileTypeRaw,
          createdAt,
        };
        return item;
      })
      .filter((x): x is MaterialFile => x !== null);
  },
};
