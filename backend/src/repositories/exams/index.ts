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
  // examId で単一試験を取得する
  get,
  // 試験レコードを保存する
  put,
  // 試験レコードを全件取得する
  scanAll,
  // 試験ステータスを更新する
  updateStatus,
  // PDF保存キーを更新する
  updatePdfS3Key,
  // 既存利用箇所向けに delete 名で削除関数を公開する
  delete: remove,
};
