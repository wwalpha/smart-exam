import { create } from './create';
import { remove } from './delete';
import { get } from './get';
import { listByMaterialId } from './listByMaterialId';
import { scanAll } from './scanAll';
import { update } from './update';

// 個別関数をまとめて再エクスポートする
export { create, get, remove, scanAll, listByMaterialId, update };

// questions リポジトリの公開APIを1オブジェクトに集約する
export const QuestionsRepository = {
  // 問題レコードを作成する
  create,
  // questionId で単一問題を取得する
  get,
  // 既存利用箇所向けに delete 名で削除関数を公開する
  delete: remove,
  // 問題レコードを全件取得する
  scanAll,
  // materialId で問題一覧を取得する
  listByMaterialId,
  // 問題レコードを部分更新する
  update,
};
