import type { SearchMaterialsResponse } from '@smart-exam/api-types';

import type { MaterialsService } from './materials.types';

// 内部で利用する処理を定義する
const searchMaterialsImpl = async (
  deps: { listMaterials: MaterialsService['listMaterials'] },
  params: Parameters<MaterialsService['searchMaterials']>[0],
): Promise<SearchMaterialsResponse> => {
  // 内部で利用する処理を定義する
  const items = await deps.listMaterials();

  // 内部で利用する処理を定義する
  const subject = (params.subject ?? '').trim();
  // 内部で利用する処理を定義する
  const grade = (params.grade ?? '').trim();
  // 内部で利用する処理を定義する
  const provider = (params.provider ?? '').trim();
  // 内部で利用する処理を定義する
  const from = (params.from ?? '').trim();
  // 内部で利用する処理を定義する
  const to = (params.to ?? '').trim();
  // 内部で利用する処理を定義する
  const q = (params.q ?? '').trim();

  // 内部で利用する処理を定義する
  const subjectLower = subject.toLowerCase();
  // 内部で利用する処理を定義する
  const qLower = q.toLowerCase();

  // 内部で利用する処理を定義する
  const filtered = items.filter((x) => {
    // 条件に応じて処理を分岐する
    if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
    // 条件に応じて処理を分岐する
    if (grade && String(x.grade ?? '') !== grade) return false;
    // 条件に応じて処理を分岐する
    if (provider && String(x.provider ?? '') !== provider) return false;

    // 条件に応じて処理を分岐する
    if (from || to) {
      // 内部で利用する処理を定義する
      const performed = String(x.materialDate ?? '');
      // 条件に応じて処理を分岐する
      if (!performed) return false;
      // 条件に応じて処理を分岐する
      if (from && performed < from) return false;
      // 条件に応じて処理を分岐する
      if (to && performed > to) return false;
    }
    // 条件に応じて処理を分岐する
    if (!qLower) return true;

    // 内部で利用する処理を定義する
    const haystack = [x.name, x.provider, x.materialDate]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' ')
      .toLowerCase();

    // 処理結果を呼び出し元へ返す
    return haystack.includes(qLower);
  });

  // 処理結果を呼び出し元へ返す
  return { items: filtered, total: filtered.length };
};

// 公開する処理を定義する
export const createSearchMaterials = (deps: {
  listMaterials: MaterialsService['listMaterials'];
}): MaterialsService['searchMaterials'] => {
  // 処理結果を呼び出し元へ返す
  return searchMaterialsImpl.bind(null, deps);
};
