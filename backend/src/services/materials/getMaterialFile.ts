import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';

const getMaterialFileImpl = async (
  repositories: Repositories,
  deps: {
    listMaterialFiles: MaterialsService['listMaterialFiles'];
  },
  materialId: string,
  fileId: string,
): ReturnType<MaterialsService['getMaterialFile']> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) return null;

  const files = await deps.listMaterialFiles(materialId);
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

export const createGetMaterialFile = (
  repositories: Repositories,
  deps: {
    listMaterialFiles: MaterialsService['listMaterialFiles'];
  },
): MaterialsService['getMaterialFile'] => {
  return getMaterialFileImpl.bind(null, repositories, deps);
};
