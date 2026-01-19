import { AwsUtils } from '@/lib/awsUtils';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';

const BUCKET_NAME = ENV.FILES_BUCKET_NAME;

export const generatePresignedUrl = async (fileName: string, contentType: string) => {
  const key = `uploads/${createUuid()}-${fileName}`;
  const url = await AwsUtils.getPresignedPutUrl({ bucket: BUCKET_NAME, key, contentType, expiresInSeconds: 3600 });
  return { uploadUrl: url, fileKey: key };
};
