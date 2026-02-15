import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { s3Client } from '@/lib/aws';

export const getPresignedGetUrl = async (params: {
  bucket: string;
  key: string;
  expiresInSeconds: number;
  responseContentDisposition?: 'inline' | 'attachment';
}): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ...(params.responseContentDisposition ? { ResponseContentDisposition: params.responseContentDisposition } : {}),
  });
  return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds });
};
