import type { GetUploadUrlRequest, GetUploadUrlResponse } from '@smart-exam/api-types';
import { apiRequest } from '@/services/apiClient';

export const getUploadUrl = async (
  fileName: string,
  contentType: string,
  prefix?: string
): Promise<GetUploadUrlResponse> => {
  const body: GetUploadUrlRequest = { fileName, contentType, prefix };

  return apiRequest<GetUploadUrlResponse, GetUploadUrlRequest>({
    method: 'POST',
    path: '/api/upload-url',
    body,
  });
};

export const uploadFileToS3 = async (uploadUrl: string, file: File): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error('S3 upload failed');
  }
};
