import type { SearchMaterialsResponse } from '@smart-exam/api-types';

import type { MaterialsService } from './createMaterialsService';

export const createSearchMaterials = (deps: {
  listMaterials: MaterialsService['listMaterials'];
}): MaterialsService['searchMaterials'] => {
  return async (params): Promise<SearchMaterialsResponse> => {
    const items = await deps.listMaterials();

    const subject = (params.subject ?? '').trim();
    const grade = (params.grade ?? '').trim();
    const provider = (params.provider ?? '').trim();
    const from = (params.from ?? '').trim();
    const to = (params.to ?? '').trim();
    const q = (params.q ?? '').trim();

    const subjectLower = subject.toLowerCase();
    const qLower = q.toLowerCase();

    const filtered = items.filter((x) => {
      if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
      if (grade && String(x.grade ?? '') !== grade) return false;
      if (provider && String(x.provider ?? '') !== provider) return false;

      if (from || to) {
        const performed = String(x.materialDate ?? '');
        if (!performed) return false;
        if (from && performed < from) return false;
        if (to && performed > to) return false;
      }
      if (!qLower) return true;

      const haystack = [x.name, x.provider, x.materialDate]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(' ')
        .toLowerCase();

      return haystack.includes(qLower);
    });

    return { items: filtered, total: filtered.length };
  };
};
