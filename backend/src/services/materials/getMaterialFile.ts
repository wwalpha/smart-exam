import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './materials.types';

export const createGetMaterialFile = async (
  deps: {
    repositories: Repositories;
    listMaterialFiles: MaterialsService['listMaterialFiles'];
  },
  materialId: string,
  fileId: string,
): ReturnType<MaterialsService['getMaterialFile']> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) return null;

  const files = await deps.listMaterialFiles(materialId);
  const target = files.find((file) => file.id === fileId);
  if (!target) return null;

  const s3Key = target.s3Key;
  const filename = target.filename || s3Key.split('/').pop() || 'file.pdf';

  const { buffer, contentType: responseContentType } = await deps.repositories.s3.getObjectBuffer({
    bucket,
    key: s3Key,
  });
  const contentType =
    responseContentType || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

  return { body: buffer, contentType, filename };
};
