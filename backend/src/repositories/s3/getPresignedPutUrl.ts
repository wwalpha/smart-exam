import { AwsUtils } from '@/lib/awsUtils';

export const getPresignedPutUrl = async (params: {
  bucket: string;
  key: string;
  contentType: string;
  expiresInSeconds: number;
}): Promise<string> => {
  return await AwsUtils.getPresignedPutUrl(params);
};
