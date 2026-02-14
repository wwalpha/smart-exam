import type { MaterialFile } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';

const listMaterialFilesImpl = async (repositories: Repositories, materialId: string): Promise<MaterialFile[]> => {
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

export const createListMaterialFiles = (repositories: Repositories): MaterialsService['listMaterialFiles'] => {
  return listMaterialFilesImpl.bind(null, repositories);
};
