import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { s3Client } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { apiHandler } from '@/lib/handler';
import type { GetUploadUrlRequest, GetUploadUrlResponse } from '@smart-exam/api-types';

const BUCKET_NAME = ENV.FILES_BUCKET_NAME;

export const generatePresignedUrl = async (fileName: string, contentType: string) => {
  const key = `uploads/${randomUUID()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { uploadUrl: url, fileKey: key };
};

type GetUploadUrlReq = Request<{}, GetUploadUrlResponse, GetUploadUrlRequest>;
type GetUploadUrlRes = Response<GetUploadUrlResponse>;

export const getUploadUrl = apiHandler(async (req: GetUploadUrlReq, res: GetUploadUrlRes) => {
  const { fileName, contentType } = req.body;
  const result = await generatePresignedUrl(fileName, contentType);
  res.json(result);
});
