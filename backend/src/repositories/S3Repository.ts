import { AwsUtils } from '@/lib/awsUtils';
import { s3Client } from '@/lib/aws';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const S3Repository = {
  getPresignedPutUrl: async (params: {
    bucket: string;
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string> => {
    return await AwsUtils.getPresignedPutUrl(params);
  },

  deletePrefix: async (params: { bucket: string; prefix: string }): Promise<void> => {
    await AwsUtils.deleteS3Prefix(params);
  },

  listObjectsByPrefix: async (params: {
    bucket: string;
    prefix: string;
  }): Promise<Array<{ key: string; lastModified?: Date }>> => {
    const response = await AwsUtils.listS3ObjectsByPrefix(params);
    return (response.Contents ?? []).flatMap((obj) => {
      const key = obj.Key;
      if (!key) return [];
      return [{ key, lastModified: obj.LastModified }];
    });
  },

  getObjectBuffer: async (params: {
    bucket: string;
    key: string;
  }): Promise<{ buffer: Buffer; contentType?: string }> => {
    return await AwsUtils.getS3ObjectBuffer(params);
  },

  putObject: async (params: { bucket: string; key: string; body: Buffer; contentType?: string }): Promise<void> => {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        Body: params.body,
        ...(params.contentType ? { ContentType: params.contentType } : {}),
      }),
    );
  },

  getPresignedGetUrl: async (params: {
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
  },
};
