import type { UploadMaterialFileRequest, UploadMaterialFileResponse } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

type MaterialPdfPathKey = 'questionPdfPath' | 'answerPdfPath' | 'answerSheetPath';
type MaterialPdfFilenameKey = 'questionPdfFilename' | 'answerPdfFilename' | 'answerSheetFilename';

const resolvePathKey = (fileType: UploadMaterialFileRequest['filetype']): MaterialPdfPathKey => {
  if (fileType === 'QUESTION') return 'questionPdfPath';
  if (fileType === 'ANSWER') return 'answerPdfPath';
  return 'answerSheetPath';
};

const resolveFilenameKey = (fileType: UploadMaterialFileRequest['filetype']): MaterialPdfFilenameKey => {
  if (fileType === 'QUESTION') return 'questionPdfFilename';
  if (fileType === 'ANSWER') return 'answerPdfFilename';
  return 'answerSheetFilename';
};

const sanitizeFileName = (fileName: string): string => {
  const safe = fileName.replace(/[\\/]/g, '_').trim();
  return safe.length > 0 ? safe : 'file.pdf';
};

export const createUploadMaterialFile = async (
  repositories: Repositories,
  materialId: string,
  request: UploadMaterialFileRequest,
): Promise<UploadMaterialFileResponse> => {
  const material = await repositories.materials.get(materialId);
  if (!material) {
    throw new ApiError('not found', 404, ['not_found']);
  }

  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) {
    throw new ApiError('files bucket is not configured', 500, ['files_bucket_not_configured']);
  }

  const fileId = createUuid();
  const fileKey = `materials/${materialId}/${request.filetype}/${fileId}`;
  const uploadUrl = await repositories.s3.getPresignedPutUrl({
    bucket,
    key: fileKey,
    contentType: request.contentType,
    expiresInSeconds: 3600,
  });

  const pathKey = resolvePathKey(request.filetype);
  const filenameKey = resolveFilenameKey(request.filetype);

  const updates: Partial<MaterialTable> = {
    [pathKey]: fileKey,
    [filenameKey]: sanitizeFileName(request.fileName),
  };

  await repositories.materials.update(materialId, updates);

  return { uploadUrl, fileKey };
};
