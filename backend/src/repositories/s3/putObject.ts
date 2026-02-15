import { PutObjectCommand } from '@aws-sdk/client-s3';

import { s3Client } from '@/lib/aws';

export const putObject = async (params: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<void> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ...(params.contentType ? { ContentType: params.contentType } : {}),
    }),
  );
};
