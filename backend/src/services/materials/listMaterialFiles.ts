import type { MaterialFile } from '@smart-exam/api-types';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { AwsUtils } from '@/lib/awsUtils';

export const listMaterialFiles = async (materialId: string): Promise<MaterialFile[]> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) return [];

  const prefix = `materials/${materialId}/`;
  const response = await AwsUtils.listS3ObjectsByPrefix({ bucket, prefix });

  const now = DateUtils.now();
  const objects = response.Contents ?? [];

  const allowedTypes = new Set<MaterialFile['fileType']>(['QUESTION', 'ANSWER', 'GRADED_ANSWER']);

  return objects
    .map((obj) => {
      const key = obj.Key;
      if (!key || key.endsWith('/')) return null;

      const parts = key.split('/');
      // materials/{materialId}/{fileType}/{id}-{filename}
      if (parts.length < 4) return null;
      const fileTypeRaw = parts[2] as MaterialFile['fileType'];
      if (!allowedTypes.has(fileTypeRaw)) return null;

      const baseName = parts.slice(3).join('/');
      const dashIndex = baseName.indexOf('-');
      const id = dashIndex > 0 ? baseName.slice(0, dashIndex) : baseName;
      const filename = dashIndex > 0 ? baseName.slice(dashIndex + 1) : baseName;

      const contentType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
      const createdAt = obj.LastModified ? DateUtils.format(obj.LastModified) : now;

      const item: MaterialFile = {
        id,
        materialId,
        filename,
        s3Key: key,
        contentType,
        fileType: fileTypeRaw,
        createdAt,
      };
      return item;
    })
    .filter((x): x is MaterialFile => x !== null);
};
