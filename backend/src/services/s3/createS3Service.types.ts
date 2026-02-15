import type { GetUploadUrlRequest, GetUploadUrlResponse } from '@smart-exam/api-types';

export type S3Service = {
  getUploadUrl: (params: GetUploadUrlRequest) => Promise<GetUploadUrlResponse>;
};
