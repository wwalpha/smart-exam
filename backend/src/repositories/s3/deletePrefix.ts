import { AwsUtils } from '@/lib/awsUtils';

export const deletePrefix = async (params: { bucket: string; prefix: string }): Promise<void> => {
  await AwsUtils.deleteS3Prefix(params);
};
