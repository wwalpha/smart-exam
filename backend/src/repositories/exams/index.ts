import { remove } from './delete';
import { get } from './get';
import { put } from './put';
import { scanAll } from './scanAll';
import { updatePdfS3Key } from './updatePdfS3Key';
import { updateStatus } from './updateStatus';

export { get, put, scanAll, updateStatus, updatePdfS3Key, remove };

export const ExamsRepository = {
  get,
  put,
  scanAll,
  updateStatus,
  updatePdfS3Key,
  delete: remove,
};
