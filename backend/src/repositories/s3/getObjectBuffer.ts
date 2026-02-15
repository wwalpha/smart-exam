import { AwsUtils } from '@/lib/awsUtils';

export const getObjectBuffer = async (params: {
  bucket: string;
  key: string;
}): Promise<{ buffer: Buffer; contentType?: string }> => {
  return await AwsUtils.getS3ObjectBuffer(params);
};
