import { AwsUtils } from '@/lib/awsUtils';

export const listObjectsByPrefix = async (params: {
  bucket: string;
  prefix: string;
}): Promise<Array<{ key: string; lastModified?: Date }>> => {
  const response = await AwsUtils.listS3ObjectsByPrefix(params);
  return (response.Contents ?? []).flatMap((obj) => {
    const key = obj.Key;
    if (!key) return [];
    return [{ key, lastModified: obj.LastModified }];
  });
};
