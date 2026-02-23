import type { MaterialFile } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

const MATERIAL_FILE_TYPES: MaterialFile['fileType'][] = ['QUESTION', 'ANSWER', 'GRADED_ANSWER'];

const UUID_V4_LIKE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const extractFileId = (baseName: string): string => {
  if (UUID_V4_LIKE_PATTERN.test(baseName)) {
    return baseName;
  }

  const dashIndex = baseName.indexOf('-');
  return dashIndex > 0 ? baseName.slice(0, dashIndex) : baseName;
};

const extractFilename = (baseName: string, mappedName: string | undefined): string => {
  if (UUID_V4_LIKE_PATTERN.test(baseName)) {
    return typeof mappedName === 'string' && mappedName.length > 0 ? mappedName : 'file.pdf';
  }

  const dashIndex = baseName.indexOf('-');
  if (dashIndex > 0) {
    return baseName.slice(dashIndex + 1);
  }

  return typeof mappedName === 'string' && mappedName.length > 0 ? mappedName : baseName;
};

export const createListMaterialFiles = async (
  repositories: Repositories,
  materialId: string,
): Promise<MaterialFile[]> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) return [];

  const prefix = `materials/${materialId}/`;
  const objects = await repositories.s3.listObjectsByPrefix({ bucket, prefix });
  const material = await repositories.materials.get(materialId);

  const filePathByType: Partial<Record<MaterialFile['fileType'], string>> = {
    QUESTION: material?.questionPdfPath,
    ANSWER: material?.answerPdfPath,
    GRADED_ANSWER: material?.answerSheetPath,
  };

  const fileNameByType: Partial<Record<MaterialFile['fileType'], string>> = {
    QUESTION: material?.questionPdfFilename,
    ANSWER: material?.answerPdfFilename,
    GRADED_ANSWER: material?.answerSheetFilename,
  };

  const currentPathSet = new Set<string>(
    MATERIAL_FILE_TYPES.map((type) => filePathByType[type]).filter((path): path is string => !!path),
  );

  const now = DateUtils.now();
  const allowedTypes = new Set<MaterialFile['fileType']>(MATERIAL_FILE_TYPES);

  return objects
    .map((obj) => {
      const key = obj.key;
      if (!key || key.endsWith('/')) return null;
      if (!currentPathSet.has(key)) return null;

      const parts = key.split('/');
      if (parts.length < 4) return null;
      const fileType = parts[2] as MaterialFile['fileType'];
      if (!allowedTypes.has(fileType)) return null;

      const baseName = parts.slice(3).join('/');
      const mappedPath = filePathByType[fileType];
      const mappedName = fileNameByType[fileType];

      const id = extractFileId(baseName);
      const filename = mappedPath === key ? extractFilename(baseName, mappedName) : baseName;

      const contentType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
      const createdAt = obj.lastModified ? DateUtils.format(obj.lastModified) : now;

      const item: MaterialFile = {
        id,
        materialId,
        filename,
        s3Key: key,
        contentType,
        fileType,
        createdAt,
      };
      return item;
    })
    .filter((item): item is MaterialFile => item !== null);
};
