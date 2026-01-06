import { MaterialsService } from '@/services/MaterialsService';
import type { MaterialTable } from '@/types/db';
import { MaterialSet, CreateMaterialSetRequest } from './repo.types';
import { DateUtils } from '@/lib/dateUtils';
import type { MaterialFile } from '@smart-exam/api-types';
import { createUuid } from '@/lib/uuid';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const MaterialRepository = {
  createMaterialSet: async (data: CreateMaterialSetRequest): Promise<MaterialSet> => {
    const id = createUuid();

    const item: MaterialSet = {
      id,
      ...data,
    };

    const dbItem: MaterialTable = {
      materialId: id,
      subjectId: data.subject,
      title: data.name,
      description: data.description,
      questionCount: 0,
      grade: data.grade,
      provider: data.provider,
      course: data.course,
      keywords: data.keywords,
      yearMonth: data.yearMonth,
    };

    await MaterialsService.create(dbItem);

    return item;
  },

  getMaterialSet: async (id: string): Promise<MaterialSet | null> => {
    const dbItem = await MaterialsService.get(id);

    if (!dbItem) return null;

    return {
      id: dbItem.materialId,
      name: dbItem.title,
      subject: dbItem.subjectId,
      grade: dbItem.grade,
      provider: dbItem.provider,
      course: dbItem.course,
      description: dbItem.description,
      keywords: dbItem.keywords,
      yearMonth: dbItem.yearMonth ?? (dbItem.date ? dbItem.date.slice(0, 7) : DateUtils.now().slice(0, 7)),
      date: dbItem.date,
    };
  },

  listMaterialSets: async (): Promise<MaterialSet[]> => {
    const items = await MaterialsService.list();

    return items.map((dbItem: MaterialTable) => ({
      id: dbItem.materialId,
      name: dbItem.title,
      subject: dbItem.subjectId,
      grade: dbItem.grade,
      provider: dbItem.provider,
      course: dbItem.course,
      description: dbItem.description,
      keywords: dbItem.keywords,
      yearMonth: dbItem.yearMonth ?? (dbItem.date ? dbItem.date.slice(0, 7) : DateUtils.now().slice(0, 7)),
      date: dbItem.date,
    }));
  },

  deleteMaterialSet: async (id: string): Promise<boolean> => {
    const existing = await MaterialsService.get(id);
    if (!existing) return false;
    await MaterialsService.delete(id);
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

  getMaterialFile: async (
    materialSetId: string,
    fileId: string
  ): Promise<{ body: Buffer; contentType: string; filename: string } | null> => {
    const bucket = ENV.FILES_BUCKET_NAME;
    if (!bucket) return null;

    const files = await MaterialRepository.listMaterialFiles(materialSetId);
    const target = files.find((f) => f.id === fileId);
    if (!target) return null;

    const s3Key = target.s3Key;
    const filename = target.filename || s3Key.split('/').pop() || 'file.pdf';

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      })
    );

    const bodyStream = response.Body;
    if (!bodyStream || typeof (bodyStream as any)?.on !== 'function') return null;

    const body = await streamToBuffer(bodyStream as Readable);
    const contentType = response.ContentType || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

    return { body, contentType, filename };
  },
};
