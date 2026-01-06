import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { s3Client } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { listMaterialFiles } from './listMaterialFiles';

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const getMaterialFile = async (
  materialSetId: string,
  fileId: string
): Promise<{ body: Buffer; contentType: string; filename: string } | null> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) return null;

  const files = await listMaterialFiles(materialSetId);
  const target = files.find((f) => f.id === fileId);
  if (!target) return null;

  const s3Key = target.s3Key;
  const filename = target.filename || s3Key.split('/').pop() || 'file.pdf';

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    })
  );

  const bodyStream = response.Body;
  if (!bodyStream || typeof (bodyStream as any)?.on !== 'function') return null;

  const body = await streamToBuffer(bodyStream as Readable);
  const contentType =
    response.ContentType || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

  return { body, contentType, filename };
};
