import type { SearchMaterialsResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { toApiMaterial } from './materialMappers';

import type { MaterialsService } from './materials.types';

export const createSearchMaterials = async (
  repositories: Repositories,
  params: Parameters<MaterialsService['searchMaterials']>[0],
): Promise<SearchMaterialsResponse> => {
  const rows = await repositories.materials.search(params);
  const items = rows.map(toApiMaterial);

  const subject = (params.subject ?? '').trim().toLowerCase();
  const grade = (params.grade ?? '').trim();
  const provider = (params.provider ?? '').trim();
  const from = (params.from ?? '').trim();
  const to = (params.to ?? '').trim();
  const q = (params.q ?? '').trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (subject && String(item.subject ?? '').toLowerCase() !== subject) return false;
    if (grade && String(item.grade ?? '') !== grade) return false;
    if (provider && String(item.provider ?? '') !== provider) return false;
    if (from && String(item.materialDate ?? '') < from) return false;
    if (to && String(item.materialDate ?? '') > to) return false;
    if (!q) return true;

    const haystack = [item.name, item.provider, item.materialDate]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  return { items: filtered, total: filtered.length };
};
