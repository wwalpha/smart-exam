import { AwsUtils } from '@/lib/awsUtils';
import { ENV } from '@/lib/env';
import { listMaterialFiles } from './listMaterialFiles';

export const getMaterialFile = async (
  materialId: string,
  fileId: string
): Promise<{ body: Buffer; contentType: string; filename: string } | null> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) return null;

  const files = await listMaterialFiles(materialId);
  const target = files.find((f) => f.id === fileId);
  if (!target) return null;

  const s3Key = target.s3Key;
  const filename = target.filename || s3Key.split('/').pop() || 'file.pdf';

  const { buffer, contentType: responseContentType } = await AwsUtils.getS3ObjectBuffer({ bucket, key: s3Key });
  const body = buffer;
  const contentType =
    responseContentType || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

  return { body, contentType, filename };
};
