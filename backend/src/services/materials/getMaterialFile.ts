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

  const downloadUrl = await deps.repositories.s3.getPresignedGetUrl({
    bucket,
    key: target.s3Key,
    expiresInSeconds: 300,
    responseContentDisposition: 'inline',
  });

  return { downloadUrl };
};
