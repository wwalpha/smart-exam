import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SearchMaterialsRequest, SearchMaterialsResponse } from '@smart-exam/api-types';

export const searchMaterials: AsyncHandler<{}, SearchMaterialsResponse, SearchMaterialsRequest, ParsedQs> = async (
  req,
  res
) => {
  const items = await MaterialRepository.listMaterials();

  const subject = (req.body.subject ?? '').trim();
  const grade = (req.body.grade ?? '').trim();
  const provider = (req.body.provider ?? '').trim();
  const from = (req.body.from ?? '').trim();
  const to = (req.body.to ?? '').trim();
  const q = (req.body.q ?? '').trim();

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

  res.json({ items: filtered, total: filtered.length });
};
