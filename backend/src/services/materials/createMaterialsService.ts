// Module: createMaterialsService responsibilities.

import type {


  CreateMaterialRequest,
  Material,
  MaterialFile,
  SearchMaterialsRequest,
  SearchMaterialsResponse,
} from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { MaterialTable } from '@/types/db';
import type { Repositories } from '@/repositories/createRepositories';

const requireYmd = (value: unknown, fieldName: string): string => {
  const trimmed = String(value ?? '').trim();
  if (!DateUtils.isValidYmd(trimmed)) {
    throw new Error(`${fieldName} is required (YYYY-MM-DD)`);
  }
  return trimmed;
};

const requireNonEmpty = (value: unknown, fieldName: string): string => {
  const trimmed = String(value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return trimmed;
};

const toApiMaterial = (dbItem: MaterialTable): Material => {
  return {
    id: dbItem.materialId,
    name: dbItem.title,
    subject: dbItem.subjectId,
    grade: requireNonEmpty(dbItem.grade, 'Material.grade'),
    provider: requireNonEmpty(dbItem.provider, 'Material.provider'),
    materialDate: requireYmd(dbItem.materialDate, 'Material.materialDate'),
    registeredDate: requireYmd(dbItem.registeredDate ?? dbItem.materialDate, 'Material.registeredDate'),
  };
};

/** Type definition for MaterialsService. */
export type MaterialsService = {
  listMaterials: () => Promise<Material[]>;
  searchMaterials: (params: SearchMaterialsRequest) => Promise<SearchMaterialsResponse>;
  createMaterial: (data: CreateMaterialRequest) => Promise<Material>;
  getMaterial: (materialId: string) => Promise<Material | null>;
  updateMaterial: (materialId: string, updates: Partial<MaterialTable>) => Promise<Material | null>;
  deleteMaterial: (materialId: string) => Promise<boolean>;
  listMaterialFiles: (materialId: string) => Promise<MaterialFile[]>;
  getMaterialFile: (
    materialId: string,
    fileId: string,
  ) => Promise<{ body: Buffer; contentType: string; filename: string } | null>;
};

/** Creates materials service. */
export const createMaterialsService = (repositories: Repositories): MaterialsService => {
  const listMaterials: MaterialsService['listMaterials'] = async () => {
    const items = await repositories.materials.list();
    return items.map(toApiMaterial);
  };

  const searchMaterials: MaterialsService['searchMaterials'] = async (params) => {
    const items = await listMaterials();

    const subject = (params.subject ?? '').trim();
    const grade = (params.grade ?? '').trim();
    const provider = (params.provider ?? '').trim();
    const from = (params.from ?? '').trim();
    const to = (params.to ?? '').trim();
    const q = (params.q ?? '').trim();

    const subjectLower = subject.toLowerCase();
    const qLower = q.toLowerCase();

    const filtered = items.filter((x) => {
      if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
      if (grade && String(x.grade ?? '') !== grade) return false;
      if (provider && String(x.provider ?? '') !== provider) return false;

      if (from || to) {
        const performed = String(x.materialDate ?? '');
        if (!performed) return false;
        if (from && performed < from) return false;
        if (to && performed > to) return false;
      }
      if (!qLower) return true;

      const haystack = [x.name, x.provider, x.materialDate]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(' ')
        .toLowerCase();

      return haystack.includes(qLower);
    });

    return { items: filtered, total: filtered.length };
  };

  const createMaterial: MaterialsService['createMaterial'] = async (data) => {
    const id = createUuid();

    const dbItem: MaterialTable = {
      materialId: id,
      subjectId: data.subject,
      title: data.name,
      questionCount: 0,
      grade: data.grade,
      provider: data.provider,
      materialDate: data.materialDate,
      registeredDate: data.registeredDate,
    };

    await repositories.materials.create(dbItem);

    return {
      id,
      ...data,
    };
  };

  const getMaterial: MaterialsService['getMaterial'] = async (materialId) => {
    const dbItem = await repositories.materials.get(materialId);
    if (!dbItem) return null;
    return toApiMaterial(dbItem);
  };

  const updateMaterial: MaterialsService['updateMaterial'] = async (materialId, updates) => {
    const next = await repositories.materials.update(materialId, updates);
    if (!next) return null;
    return toApiMaterial(next);
  };

  const deleteMaterial: MaterialsService['deleteMaterial'] = async (materialId) => {
    const existing = await repositories.materials.get(materialId);
    if (!existing) return false;

    const materialQuestions = await repositories.questions.listByMaterialId(materialId);

    // 教材削除時は、復習候補と問題もまとめて削除する（孤児候補や復習テストへの混入を防ぐため）
    for (const q of materialQuestions) {
      await repositories.reviewTestCandidates.deleteOpenCandidatesByTargetId({
        subject: q.subjectId,
        targetId: q.questionId,
      });
      await repositories.questions.delete(q.questionId);
    }

    if (materialQuestions.length > 0) {
      const deletedQuestionIds = new Set(materialQuestions.map((q) => q.questionId));
      const tests = await repositories.reviewTests.scanAll();

      for (const test of tests) {
        if (test.mode !== 'QUESTION') continue;

        const hasAny =
          test.questions?.some((qid) => deletedQuestionIds.has(qid)) ||
          test.results?.some((r) => deletedQuestionIds.has(r.id));
        if (!hasAny) continue;

        const nextQuestions = (test.questions ?? []).filter((qid) => !deletedQuestionIds.has(qid));
        const nextResults = test.results ? test.results.filter((r) => !deletedQuestionIds.has(r.id)) : undefined;

        await repositories.reviewTests.put({
          ...test,
          questions: nextQuestions,
          count: nextQuestions.length,
          results: nextResults,
        });
      }
    }

    // S3 上の教材ファイルを削除する（materials/{materialId}/...）
    const bucket = ENV.FILES_BUCKET_NAME;
    if (bucket) {
      await repositories.s3.deletePrefix({ bucket, prefix: `materials/${materialId}/` });
    }

    await repositories.materials.delete(materialId);
    return true;
  };

  const listMaterialFiles: MaterialsService['listMaterialFiles'] = async (materialId) => {
    const bucket = ENV.FILES_BUCKET_NAME;
    if (!bucket) return [];

    const prefix = `materials/${materialId}/`;
    const objects = await repositories.s3.listObjectsByPrefix({ bucket, prefix });

    const now = DateUtils.now();
    const allowedTypes = new Set<MaterialFile['fileType']>(['QUESTION', 'ANSWER', 'GRADED_ANSWER']);

    return objects
      .map((obj) => {
        const key = obj.key;
        if (!key || key.endsWith('/')) return null;

        const parts = key.split('/');
        // materials/{materialId}/{fileType}/{id}-{filename}
        if (parts.length < 4) return null;
        const fileTypeRaw = parts[2] as MaterialFile['fileType'];
        if (!allowedTypes.has(fileTypeRaw)) return null;

        const baseName = parts.slice(3).join('/');
        const dashIndex = baseName.indexOf('-');
        const id = dashIndex > 0 ? baseName.slice(0, dashIndex) : baseName;
        const filename = dashIndex > 0 ? baseName.slice(dashIndex + 1) : baseName;

        const contentType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
        const createdAt = obj.lastModified ? DateUtils.format(obj.lastModified) : now;

        const item: MaterialFile = {
          id,
          materialId,
          filename,
          s3Key: key,
          contentType,
          fileType: fileTypeRaw,
          createdAt,
        };
        return item;
      })
      .filter((x): x is MaterialFile => x !== null);
  };

  const getMaterialFile: MaterialsService['getMaterialFile'] = async (materialId, fileId) => {
    const bucket = ENV.FILES_BUCKET_NAME;
    if (!bucket) return null;

    const files = await listMaterialFiles(materialId);
    const target = files.find((f) => f.id === fileId);
    if (!target) return null;

    const s3Key = target.s3Key;
    const filename = target.filename || s3Key.split('/').pop() || 'file.pdf';

    const { buffer, contentType: responseContentType } = await repositories.s3.getObjectBuffer({ bucket, key: s3Key });
    const body = buffer;
    const contentType =
      responseContentType || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

    return { body, contentType, filename };
  };

  return {
    listMaterials,
    searchMaterials,
    createMaterial,
    getMaterial,
    updateMaterial,
    deleteMaterial,
    listMaterialFiles,
    getMaterialFile,
  };
};
