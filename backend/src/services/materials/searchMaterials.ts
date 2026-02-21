import type { SearchMaterialsResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { toApiMaterial } from './materialMappers';

import type { MaterialsService } from './materials.types';

// 公開する処理を定義する
export const createSearchMaterials = (repositories: Repositories): MaterialsService['searchMaterials'] => {
  // 処理結果を呼び出し元へ返す
  return async (params: Parameters<MaterialsService['searchMaterials']>[0]): Promise<SearchMaterialsResponse> => {
    // 専用の検索クエリを発行して対象を取得する
    const rows = await repositories.materials.search(params);
    const items = rows.map(toApiMaterial);

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

    // `q` のみ大文字小文字を吸収するため、最終段で補完フィルタする
    const filtered = items.filter((x) => {
      if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
      if (grade && String(x.grade ?? '') !== grade) return false;
      if (provider && String(x.provider ?? '') !== provider) return false;
      if (from && String(x.materialDate ?? '') < from) return false;
      if (to && String(x.materialDate ?? '') > to) return false;
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
};
