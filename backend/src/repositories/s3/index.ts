import { deletePrefix } from './deletePrefix';
import { getObjectBuffer } from './getObjectBuffer';
import { getPresignedGetUrl } from './getPresignedGetUrl';
import { getPresignedPutUrl } from './getPresignedPutUrl';
import { listObjectsByPrefix } from './listObjectsByPrefix';
import { putObject } from './putObject';

export { deletePrefix, getObjectBuffer, getPresignedGetUrl, getPresignedPutUrl, listObjectsByPrefix, putObject };

export const S3Repository = {
  getPresignedPutUrl,
  deletePrefix,
  listObjectsByPrefix,
  getObjectBuffer,
  putObject,
  getPresignedGetUrl,
};
