import { remove } from './delete';
import { get } from './get';
import { put } from './put';
import { scanAll } from './scanAll';
import { updatePdfS3Key } from './updatePdfS3Key';
import { updateStatus } from './updateStatus';

// 個別関数をまとめて再エクスポートする
export { get, put, scanAll, updateStatus, updatePdfS3Key, remove };

// exams リポジトリの公開APIを1オブジェクトに集約する
export const ExamsRepository = {
  get,
  put,
  scanAll,
  updateStatus,
  updatePdfS3Key,
  delete: remove,
};
